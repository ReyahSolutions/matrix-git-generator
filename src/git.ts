import { exec } from '@actions/exec';

export const NULL_SHA = '0000000000000000000000000000000000000000';
export const FETCH_HEAD = 'FETCH_HEAD';

export function isTagRef(ref: string): boolean {
    return ref.startsWith('refs/tags/');
}

export function trimRefs(ref: string): string {
    return trimStart(ref, 'refs/')
}

export function trimRefsHeads(ref: string): string {
    const trimRef = trimStart(ref, 'refs/')
    return trimStart(trimRef, 'heads/')
}

function trimStart(ref: string, start: string): string {
    return ref.startsWith(start) ? ref.substr(start.length) : ref
}

export async function fetchCommit(ref: string): Promise<void> {
    if (await exec('git', ['fetch', '--depth=1', '--no-tags', 'origin', ref]) !== 0) {
        throw new Error(`Fetching ${ref} failed`);
    }
}

export async function getChangedFiles(ref: string): Promise<string[]> {
    let buffer = '';

    const code = await exec('git', ['diff-index', '--name-only', ref], {
        listeners: {
            stdout: (data => buffer += data.toString())
        }
    });
    if (code !== 0) {
        throw new Error(`Couldn't determine changed files`);
    }

    return buffer
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}
