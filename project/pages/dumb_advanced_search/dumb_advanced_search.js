var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { l2TagRater } from "../../classes/tag raters/L2TagRater.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
const ttrbEle = smartGetElement("ttrb", HTMLInputElement);
const createRaterEle = smartGetElement("createRater", HTMLButtonElement);
const checkInitEle = smartGetElement("checkInit", HTMLButtonElement);
const initStatusEle = smartGetElement("initStatus", HTMLDivElement);
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const batchSizeEle = smartGetElement("batchSize", HTMLInputElement);
const fetchBatchEle = smartGetElement("fetchBatch", HTMLButtonElement);
const searchResultsEle = smartGetElement("searchResults", HTMLSpanElement);
let tagRater;
const idsOfRatedPosts = new Set();
const idToRating = new Map();
const idToPost = new Map();
//create rater button
createRaterEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        tagRater = new l2TagRater(ttrbEle.value);
        tagRater.init();
    });
});
//check rater initialization button
checkInitEle.addEventListener("click", function () {
    initStatusEle.replaceChildren();
    initStatusEle.appendChild(toHtml(smartEl("div", {}, [`${JSON.stringify(tagRater)}`])));
});
//fetch batch button
fetchBatchEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tagRater || !tagRater.initialized) {
            console.log("tag rater is not ready");
            return;
        }
        if (batchSizeEle.value === "") {
            batchSizeEle.value = `${100}`;
        }
        const batchSize = Number(batchSizeEle.value);
        const literalSearch = literalSearchEle.value;
        //1 fetch new batch
        let batch = yield getPosts(literalSearch, batchSize, {});
        //2 rate new batch
        const newPostIdToRatingPromise = new Map();
        // const tags = []
        // for (const tag of batch[0].tags.values()) {
        //     tags.push(tag)
        // }
        // console.log(await tagRater.rate(tags[0]))
        for (const post of batch) {
            newPostIdToRatingPromise.set(post.id, tagRater.ratePost(post));
            console.log(`just initiated rating of post: ${post.siteUrl}`);
        }
        for (const post of batch) {
            const rating = yield newPostIdToRatingPromise.get(post.id);
            idToRating.set(post.id, rating);
            idsOfRatedPosts.add(post.id);
            idToPost.set(post.id, post);
            console.log(post.siteUrl);
            console.log(rating);
        }
        //3 reset display
    });
});
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
