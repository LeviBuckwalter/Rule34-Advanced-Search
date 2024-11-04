var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { postsApiWithCache } from "../../caches/post_caching/post_caching_functions.js";
import { getCount } from "../../caches/prompt_count_cache/PromptCount$_functions.js";
export function getPosts(prompt, amtPosts, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lookInCache = true, storeInCache = true } = options;
        const pages = Math.ceil(amtPosts / 1000);
        const promises = [];
        for (let pid = 0; pid < pages; pid++) {
            promises.push(postsApiWithCache(prompt, pid, { lookInCache, storeInCache }));
        }
        const posts = [];
        for (const promise of promises) {
            posts.push(...(yield promise));
        }
        return posts.slice(0, amtPosts);
    });
}
// export async function validTags(...tags: string[]): Promise<boolean> {
//     const promises: Promise<number>[] = []
//     for (const tag of tags) {
//         promises.push(countWithCache(tag))
//     }
//     for (const promise of promises) {
//         if ((await promise) === 0) {
//             return false
//         }
//     }//else:
//     return true
// }
export function getProportion(promptSubgroup_1, promptBaseline_1) {
    return __awaiter(this, arguments, void 0, function* (promptSubgroup, promptBaseline, options = {}) {
        /*
        Gets the proportion of posts defined by promptBaseline that also fit promptSubgroup.
        So, like, if promptBaseline is "feet", and promptSubgroup is "green_eyes", this would answer the question "what proportion of foot posts are tagged green eyes".
        */
        const { plusOneBuffer = false, lookInCacheSubgroup = true, storeInCacheSubgroup = true, lookInCacheBaseline = true, storeInCacheBaseline = true } = options;
        const countBl = getCount(promptBaseline, {
            lookInCache: lookInCacheBaseline,
            storeInCache: storeInCacheBaseline
        });
        const countSg = getCount(`${promptBaseline} ${promptSubgroup}`, {
            lookInCache: lookInCacheSubgroup,
            storeInCache: storeInCacheSubgroup
        });
        const buffer = (plusOneBuffer) ? 1 : 0;
        return ((yield countSg) + buffer) / ((yield countBl) + buffer);
    });
}
export function getRelativeProportion(promptSubgroup, promptBaseline, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lookInCache = true, storeInCache = true } = options;
        const countAll = getCount("", { lookInCache, storeInCache });
        const countBl = getCount(promptBaseline, { lookInCache, storeInCache });
        const countSgIndependant = getCount(promptSubgroup, { lookInCache, storeInCache });
        const countSg = getCount(`${promptBaseline} ${promptSubgroup}`, { lookInCache, storeInCache });
        return {
            relativeProportion: ((yield countSg) / (yield countBl)) / ((yield countSgIndependant) / (yield countAll)),
            datapoints: yield countBl
        };
    });
}
export function getCommonness(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        //returns the proportion of posts on the site with the given tag
        const amtAllPosts = getCount("", {});
        const amtPostsTag = getCount(tag, {});
        return (yield amtPostsTag) / (yield amtAllPosts);
    });
}
