import * as core from '@actions/core';
import * as github from '@actions/github';
import { Webhooks } from '@octokit/webhooks';

import * as git from './git';

async function run() {
    try {
        const token = core.getInput('token', { required: false });
        const filtersInput = core.getInput('filters', { required: true });
        let filters;
        if (!Array.isArray(filtersInput)) {
            filters = [filtersInput];
        } else {
            filters = filtersInput;
        }
        const changes = getFileChanges(token);
        console.log(changes);
        console.log(filters);
    } catch (err) {
        core.setFailed(err.message);
    }
}

async function getFileChanges(token: string): Promise<string[]> {
    const push = github.context.payload as Webhooks.WebhookPayloadPush;

    if (git.isTagRef(push.ref)) {
        return [];
    }

    const baseInput = git.trimRefs(core.getInput('base', { required: false }));

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

run();
