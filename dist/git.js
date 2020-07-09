"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChangedFiles = exports.fetchCommit = exports.trimRefsHeads = exports.trimRefs = exports.isTagRef = exports.FETCH_HEAD = exports.NULL_SHA = void 0;
const exec_1 = require("@actions/exec");
exports.NULL_SHA = '0000000000000000000000000000000000000000';
exports.FETCH_HEAD = 'FETCH_HEAD';
function isTagRef(ref) {
    return ref.startsWith('refs/tags/');
}
exports.isTagRef = isTagRef;
function trimRefs(ref) {
    return trimStart(ref, 'refs/');
}
exports.trimRefs = trimRefs;
function trimRefsHeads(ref) {
    const trimRef = trimStart(ref, 'refs/');
    return trimStart(trimRef, 'heads/');
}
exports.trimRefsHeads = trimRefsHeads;
function trimStart(ref, start) {
    return ref.startsWith(start) ? ref.substr(start.length) : ref;
}
function fetchCommit(ref) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield exec_1.exec('git', ['fetch', '--depth=1', '--no-tags', 'origin', ref])) !== 0) {
            throw new Error(`Fetching ${ref} failed`);
        }
    });
}
exports.fetchCommit = fetchCommit;
function getChangedFiles(ref) {
    return __awaiter(this, void 0, void 0, function* () {
        let buffer = '';
        const code = yield exec_1.exec('git', ['diff-index', '--name-only', ref], {
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
    });
}
exports.getChangedFiles = getChangedFiles;
