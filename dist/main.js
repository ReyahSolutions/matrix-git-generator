"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const git = __importStar(require("./git"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core.getInput('token', { required: false });
            const filtersInput = core.getInput('filters', { required: true });
            let filters;
            if (!Array.isArray(filtersInput)) {
                filters = [filtersInput];
            }
            else {
                filters = filtersInput;
            }
            const changes = getFileChanges(token);
            console.log(changes);
            console.log(filters);
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
}
function getFileChanges(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const push = github.context.payload;
        if (git.isTagRef(push.ref)) {
            return [];
        }
        const baseInput = git.trimRefs(core.getInput('base', { required: false }));
        const base = git.trimRefsHeads(baseInput) === git.trimRefsHeads(push.ref) ? push.before : baseInput;
        if (base === git.NULL_SHA) {
            return [];
        }
        return yield getChangedFilesFromGit(base);
    });
}
function getChangedFilesFromGit(ref) {
    return __awaiter(this, void 0, void 0, function* () {
        yield git.fetchCommit(ref);
        return yield git.getChangedFiles(git.FETCH_HEAD);
    });
}
run();
