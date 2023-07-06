import * as core from '@actions/core';
import * as github from '@actions/github';
import { PullRequestEvent, PushEvent } from '@octokit/webhooks-types';
import { match } from 'minimatch';

import * as git from './git';

export async function run() {
  try {
    let output: string[] = [];
    const token = core.getInput('token', { required: true });
    const depth: number = parseInt(core.getInput('depth', { required: false }));
    const filtersInput = core.getInput('filters', { required: true });
    const filterExcludeInput = core.getInput('exclude', { required: false });
    const alwaysTriggerDirs: string[] = core
      .getInput('alwaysTriggerDirs', { required: false })
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const filters = filtersInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const exclude = filterExcludeInput
      ? filterExcludeInput
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    let changes = await getFileChanges(token);
    console.log('Files changed: ' + changes);

    if (shouldAlwaysTrigger(alwaysTriggerDirs, changes)) {
      console.log(
        'One of the alwaysTriggerDirs was changed, triggering builds for all services'
      );
      changes = await getAllFilesFromGit(github.context.ref, depth);
    }

    output = getOutput(filters, exclude, changes, depth);
    console.log('Modified files: ' + output);

    core.setOutput('matrix', JSON.stringify(output));
    core.setOutput('empty', JSON.stringify(output.length === 0));
  } catch (err) {
    core.setFailed(err.message);
  }
}

export function getOutput(
  filters: string[],
  exclude: string[],
  changes: string[],
  depth: number
) {
  const output: string[] = [];
  const allMatches: string[] = [];
  filters.forEach((filter) => {
    const matchList = match(changes, filter, { dot: true });
    matchList.forEach((potentialMatch) => {
      if (allMatches.indexOf(potentialMatch) === -1) {
        allMatches.push(potentialMatch);
      }
    });
  });
  exclude.forEach((filter) => {
    const matchList = match(allMatches, filter, { dot: true });
    matchList.forEach((match) => {
      const index = allMatches.indexOf(match);
      if (index > -1) {
        allMatches.splice(index, 1);
      }
    });
  });
  allMatches.forEach((match) => {
    const baseFolder = match.split('/').slice(0, depth).join('/');
    if (output.indexOf(baseFolder) === -1) {
      output.push(baseFolder);
    }
  });
  return output;
}

async function getFileChanges(token: string): Promise<string[] | null> {
  if (github.context.eventName === 'pull_request') {
    const pr = (github.context.payload as PullRequestEvent).pull_request;
    return await getChangedFilesFromApi(token, pr);
  } else if (github.context.eventName === 'push') {
    return getFileChangesFromPush();
  } else {
    throw new Error(
      'This action can be triggered only by pull_request or push event'
    );
  }
}

async function getFileChangesFromPush(): Promise<string[]> {
  const push = github.context.payload as PushEvent;

  if (git.isTagRef(push.ref)) {
    return [];
  }

  const baseInput = git.trimRefs(core.getInput('base', { required: false }));

  const base =
    git.trimRefsHeads(baseInput) === git.trimRefsHeads(push.ref)
      ? push.before
      : baseInput;
  if (base === git.NULL_SHA) {
    return [];
  }
  return await getChangedFilesFromGit(base);
}

async function getChangedFilesFromGit(ref: string): Promise<string[]> {
  await git.fetchCommit(ref);
  return await git.getChangedFiles(git.FETCH_HEAD);
}

export async function getAllFilesFromGit(
  ref: string,
  depth: number
): Promise<string[]> {
  await git.fetchCommit(ref);
  return await git.getAllFilesForDepth(depth);
}

async function getChangedFilesFromApi(
  token: string,
  pullRequest: PullRequestEvent['pull_request']
): Promise<string[]> {
  const client = github.getOctokit(token);
  const pageSize = 100;
  const files: string[] = [];

  // convert changedFiles to the nearest multiple of pageSize
  const changedFiles =
    Math.ceil(pullRequest.changed_files / pageSize) * pageSize;

  for (let page = 1; page * pageSize <= changedFiles; page++) {
    const response = await client.rest.pulls.listFiles({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pullRequest.number,
      page,
      per_page: pageSize
    });
    for (const row of response.data) {
      files.push(row.filename);
    }
  }
  return files;
}

run().catch((err) => core.setFailed(err.message));

export function shouldAlwaysTrigger(
  alwaysTriggerDirs: string[],
  changes: string[]
) {
  for (const dir of alwaysTriggerDirs) {
    if (match(changes, dir, { dot: true }).length > 0) {
      return true;
    }
  }
  return false;
}
