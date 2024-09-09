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
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../functions/PostDisplayArray.js";
import { smartGetElement } from "../../functions/generalFunctions.js";
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
const alwaysUseCensusCBEle = smartGetElement("alwaysUseCensusCheckbox", HTMLInputElement);
const censusSizeEle = smartGetElement("censusSizeInput", HTMLInputElement);
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const sortForEle = smartGetElement("sortFor", HTMLInputElement);
const sortAgainstEle = smartGetElement("sortAgainst", HTMLInputElement);
const statusDisplayEle = smartGetElement("statusDiv", HTMLDivElement);
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {});
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement);
searchButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        statusDisplayEle.innerText = `Doing pre-search work...`;
        const literalSearchCount = yield getCount(literalSearchEle.value, {});
        const sortForCount = yield getCount(sortForEle.value, {});
        const sortAgainstCount = yield getCount(sortAgainstEle.value, {});
        if (censusSizeEle.value === "") {
            censusSizeEle.value = `10000`;
        }
        const censusSize = Number(censusSizeEle.value);
        let censusFor;
        let censusAgainst;
        if (sortForCount < censusSize || alwaysUseCensusCBEle.checked) {
            censusFor = new Census(yield getPosts(sortForEle.value, censusSize, {}));
        }
        if (sortAgainstCount < censusSize || alwaysUseCensusCBEle.checked) {
            censusAgainst = new Census(yield getPosts(sortAgainstEle.value, censusSize, {}));
        }
        let amtPosts = 1;
        while (amtPosts < Math.min(50000, literalSearchCount * 2) && !searchNeedsStopped) {
            statusDisplayEle.innerText = `Redoing search with ${amtPosts} posts...`;
            yield search(amtPosts, censusFor, censusAgainst);
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
function rateTag(t, promptFor, promptAgainst, censusFor, censusAgainst) {
    return __awaiter(this, void 0, void 0, function* () {
        let proportionFor = undefined;
        if (censusFor) {
            proportionFor = (censusFor.count(t) + 1) / (censusFor.size + 2);
        }
        else {
            const countOfTInFor = yield getCount(`${t} ${promptFor}`, { lookInCache: false, storeInCache: false });
            const countOfFor = yield getCount(promptFor, {}); //use cache for this
            proportionFor = (countOfTInFor + 1) / (countOfFor + 2);
        }
        let proportionAgainst = undefined;
        if (censusAgainst) {
            proportionAgainst = (censusAgainst.count(t) + 1) / (censusAgainst.size + 2);
        }
        else {
            const countOfTInAgainst = yield getCount(`${t} ${promptAgainst}`, { lookInCache: false, storeInCache: false });
            const countOfAgainst = yield getCount(promptAgainst, {}); //use cache for this
            proportionAgainst = (countOfTInAgainst + 1) / (countOfAgainst + 2);
        }
        const ret = proportionFor / proportionAgainst;
        console.log(`just rated the tag ${t} as ${ret}`);
        return ret;
    });
}
const rateTagF$ = new AsyncFunctionCache(rateTag, 10000, 24);
function ratePost(p, promptFor, promptAgainst, censusFor, censusAgainst) {
    return __awaiter(this, void 0, void 0, function* () {
        const ratingPromises = [];
        for (const tag of p.tags.values()) {
            ratingPromises.push(rateTagF$.call(tag, promptFor, promptAgainst, censusFor, censusAgainst));
        }
        const ratings = yield Promise.all(ratingPromises);
        let product = 1;
        for (const rating of ratings) {
            product *= rating;
        }
        return Math.pow(product, 1 / p.tags.size);
    });
}
function search(amtPosts, censusFor, censusAgainst) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchedPosts = yield getPosts(literalSearchEle.value, amtPosts, {});
        const promptFor = sortForEle.value;
        const promptAgainst = sortAgainstEle.value;
        const postRatingPromises = []; //an array in the same order as searchedPosts
        for (const post of searchedPosts) {
            postRatingPromises.push(ratePost(post, promptFor, promptAgainst, censusFor, censusAgainst));
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
