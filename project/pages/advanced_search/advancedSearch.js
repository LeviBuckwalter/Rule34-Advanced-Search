var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AsyncFunctionCache } from "../../../R34-Tools/Cache/src/classes/FunctionCache/Async.js";
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { getCount } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../functions/PostDisplayArray.js";
import { smartGetElement } from "../../functions/generalFunctions.js";
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const sortForEle = smartGetElement("sortFor", HTMLInputElement);
const sortAgainstEle = smartGetElement("sortAgainst", HTMLInputElement);
const statusDisplayEle = smartGetElement("statusDiv", HTMLDivElement);
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {});
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement);
searchButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const literalSearchCount = yield getCount(literalSearchEle.value, {});
        let amtPosts = 1;
        while (amtPosts < Math.min(50000, literalSearchCount * 2) && !searchNeedsStopped) {
            statusDisplayEle.innerText = `Redoing search with ${amtPosts} posts...`;
            yield search(amtPosts);
            amtPosts *= 2;
        }
        statusDisplayEle.innerText = `Search stopped`;
        searchNeedsStopped = false;
    });
});
const stopSearchButtonEle = smartGetElement("stopSearchButton", HTMLButtonElement);
stopSearchButtonEle.addEventListener("click", function () {
    statusDisplayEle.innerText = `Okay I'm stopping, just let me finish this...`;
    searchNeedsStopped = true;
});
let searchNeedsStopped = false;
function rateTag(t, promptFor, promptAgainst) {
    return __awaiter(this, void 0, void 0, function* () {
        // const propForPromise = getProportion(t, promptFor, {
        //     lookInCacheSubgroup: false,
        //     storeInCacheSubgroup: false
        // })
        // const propAgainstPromise = getProportion(t, promptAgainst, {
        //     lookInCacheSubgroup: false,
        //     storeInCacheSubgroup: false
        // })
        const countOfTInPromptFor = getCount(`${t} ${promptFor}`, { lookInCache: false, storeInCache: false });
        const countOfPromptFor = getCount(promptFor, {}); //use cache for this
        const countOfTInPromptAgainst = getCount(`${t} ${promptAgainst}`, { lookInCache: false, storeInCache: false });
        const countOfPromptAgainst = getCount(promptAgainst, {}); //use cache for this
        const proportionFor = ((yield countOfTInPromptFor) + 1) / ((yield countOfPromptFor) + 2);
        const proportionAgainst = ((yield countOfTInPromptAgainst) + 1) / ((yield countOfPromptAgainst) + 2);
        const ret = proportionFor / proportionAgainst;
        console.log(`just rated the tag ${t} as ${ret}`);
        return ret;
    });
}
const rateTagF$ = new AsyncFunctionCache(rateTag, 10000, 24);
function ratePost(p, promptFor, promptAgainst) {
    return __awaiter(this, void 0, void 0, function* () {
        const ratingPromises = [];
        for (const tag of p.tags.values()) {
            ratingPromises.push(rateTagF$.call(tag, promptFor, promptAgainst));
        }
        const ratings = yield Promise.all(ratingPromises);
        let product = 1;
        for (const rating of ratings) {
            product *= rating;
        }
        return Math.pow(product, 1 / p.tags.size);
    });
}
function search(amtPosts) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchedPosts = yield getPosts(literalSearchEle.value, amtPosts, {});
        const promptFor = sortForEle.value;
        const promptAgainst = sortAgainstEle.value;
        const postRatingPromises = []; //an array in the same order as searchedPosts
        for (const post of searchedPosts) {
            postRatingPromises.push(ratePost(post, promptFor, promptAgainst));
        }
        const postRatings = yield Promise.all(postRatingPromises);
        const postIdToRating = new Map();
        for (let i = 0; i < searchedPosts.length; i++) {
            const post = searchedPosts[i];
            const rating = postRatings[i];
            postIdToRating.set(post.id, rating);
        }
        searchedPosts.sort(function (a, b) {
            return postIdToRating.get(b.id) - postIdToRating.get(a.id);
        });
        pdArray.posts = searchedPosts;
        pdArray.currentPage = 1;
        pdArray.display();
    });
}
