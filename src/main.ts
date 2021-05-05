import * as core from '@actions/core';
import * as github from '@actions/github';
import { Webhooks } from '@octokit/webhooks';
import { match } from 'minimatch';

import * as git from './git';

async function run() {
    try {
        const output: string[] = [];
        const token = core.getInput('token', {required: false});
        const filtersInput = core.getInput('filters', {required: true});
        const filters = filtersInput.split('\n').map(s => s.trim()).filter(s => s.length > 0).
            map(s => {
                const parts = s.split(':', 2)
                const idx = parts.length == 2
                    ? parseInt(parts[1], 10)
                    : 0
                return [parts[0], idx] as const
            });
        const changes = await getFileChanges(token);
        filters.forEach(([filter, idx]) => {
            const matchList = match(changes, filter);
            matchList.forEach(potentialMatch => {
                const baseFolder = potentialMatch.split("/").slice(0, idx).join("/");
                if (output.indexOf(baseFolder) === -1) {
                    output.push(baseFolder);
                }
            })
        });
        core.setOutput('matrix', JSON.stringify(output));
        core.setOutput('empty', JSON.stringify(output.length === 0));
    } catch (err) {
        core.setFailed(err.message);
    }
}

async function getFileChanges(token: string): Promise<string[] | null> {
    if (github.context.eventName === 'pull_request') {
        const pr = github.context.payload.pull_request as Webhooks.WebhookPayloadPullRequestPullRequest;
        return token ? await getChangedFilesFromApi(token, pr) : await getChangedFilesFromGit(pr.base.sha);
    } else if (github.context.eventName === 'push') {
        return getFileChangesFromPush();
    } else {
        throw new Error('This action can be triggered only by pull_request or push event');
    }
}

async function getFileChangesFromPush(): Promise<string[]> {
    const push = github.context.payload as Webhooks.WebhookPayloadPush;

    if (git.isTagRef(push.ref)) {
        return [];
    }

    const baseInput = git.trimRefs(core.getInput('base', {required: false}));

    const base = git.trimRefsHeads(baseInput) === git.trimRefsHeads(push.ref) ? push.before : baseInput
    if (base === git.NULL_SHA) {
        return [];
    }
    return await getChangedFilesFromGit(base);
}

async function getChangedFilesFromGit(ref: string): Promise<string[]> {
    await git.fetchCommit(ref);
    return await git.getChangedFiles(git.FETCH_HEAD);
}

async function getChangedFilesFromApi(
    token: string,
    pullRequest: Webhooks.WebhookPayloadPullRequestPullRequest
): Promise<string[]> {
    const client = github.getOctokit(token);
    const pageSize = 100
    const files: string[] = []
    for (let page = 0; page * pageSize < pullRequest.changed_files; page++) {
        const response = await client.pulls.listFiles({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: pullRequest.number,
            page,
            per_page: pageSize
        })
        for (const row of response.data) {
            files.push(row.filename)
        }
    }
    return files
}

run().catch(err => core.setFailed(err.message));
