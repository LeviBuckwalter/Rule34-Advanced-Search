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
import { PromptCountFC } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$.js";
import { getCommonness, getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { roundTo } from "../../functions/general_functions.js";
import { smartGetElement } from "../../functions/html_functions.js";
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
const exhaustedTags = new Set();
let topTagsList = [];
const topTagsSet = new Set();
const maxTopTags = 100;
let searching = false;
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const litSearchCountDispEle = smartGetElement("litSearchCountDisp", HTMLSpanElement);
const sortForEle = smartGetElement("sortFor", HTMLInputElement);
const sortForCountDispEle = smartGetElement("sortForCountDisp", HTMLSpanElement);
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement);
const stopSearchButtonEle = smartGetElement("stopSearchButton", HTMLButtonElement);
const searchTextDispEle = smartGetElement("searchTextDisp", HTMLSpanElement);
stopSearchButtonEle.addEventListener("click", function () { searching = false; });
searchButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        searchTextDispEle.textContent = `Beginning search...`;
        exhaustedTags.clear();
        topTagsList = [];
        topTagsSet.clear();
        const literalSearchPrompt = literalSearchEle.value;
        litSearchCountDispEle.textContent = `${yield PromptCountFC.call(literalSearchPrompt)}`;
        const ttrb = sortForEle.value;
        sortForCountDispEle.textContent = `${yield PromptCountFC.call(ttrb)}`;
        const comTtrb = getCommonness(ttrb);
        const ratedPostsById = new Map();
        const ratingsById = new Map();
        const ratedPostsOrdered = [];
        searching = true;
        while (searching) {
            let tagCurrentlySearching = null;
            if (topTagsList.length > 0) {
                searchTextDispEle.textContent = `Searching "${topTagsList[0].tag}" (rating: ${roundTo(Math.log10(topTagsList[0].rating), 2)})`;
                console.log(topTagsList[0].tag, topTagsList[0].rating);
                tagCurrentlySearching = topTagsList[0].tag;
            }
            const searchPrompt = `${literalSearchPrompt} ${(tagCurrentlySearching) ? tagCurrentlySearching : ""}`;
            const postsToRate = yield getPosts(searchPrompt, 1000, {});
            const postRatingPromises = [];
            for (const post of postsToRate) {
                if (ratedPostsById.has(post.id)) {
                    continue;
                }
                postRatingPromises.push({
                    post: post,
                    ratingPromise: ratePost(post, ttrb, yield comTtrb)
                });
                if (postRatingPromises.length >= 10) {
                    break;
                }
            }
            if (postRatingPromises.length < 10) {
                if (!tagCurrentlySearching) {
                    console.log("reached end of literal search");
                    searching = false;
                }
                else {
                    exhaustedTags.add(tagCurrentlySearching);
                    topTagsList.splice(0, 1);
                }
            }
            for (const { post, ratingPromise } of postRatingPromises) {
                ratedPostsById.set(post.id, post);
                ratingsById.set(post.id, yield ratingPromise);
                ratedPostsOrdered.push(post);
            }
            ratedPostsOrdered.sort(function (a, b) {
                return ratingsById.get(b.id) - ratingsById.get(a.id);
            });
            pdArray.posts = ratedPostsOrdered;
            pdArray.display();
        }
        // const postRatingPromisesById: Map<number, Promise<number>> = new Map()
        // for (const post of postsToRate) {
        //     postRatingPromisesById.set(post.id, ratePost(post, ttrb, await comTtrb))
        // }
        // const postRatingsById: Map<number, number> = new Map()
        // for (const post of postsToRate) {
        //     postRatingsById.set(post.id, await postRatingPromisesById.get(post.id)!)
        // }
        // postsToRate.sort(function (a, b) {
        //     return postRatingsById.get(b.id)! - postRatingsById.get(a.id)!
        // })
        // pdArray.posts = postsToRate
        // pdArray.display()
    });
});
// searchButtonEle.addEventListener("click", async function () {
//     const ttrb = sortForEle.value
//     const literalSearchPrompt = literalSearchEle.value
//     const comTtrb = getCommonness(ttrb)
//     if (amtPostsEle.value === "") {
//         amtPostsEle.value = `${100}`
//     }
//     const amtPostsNum = Number(amtPostsEle.value)
//     const postsToRate = await getPosts(literalSearchPrompt, amtPostsNum, {})
//     const postRatingPromisesById: Map<number, Promise<number>> = new Map()
//     for (const post of postsToRate) {
//         postRatingPromisesById.set(post.id, ratePost(post, ttrb, await comTtrb))
//     }
//     const postRatingsById: Map<number, number> = new Map()
//     for (const post of postsToRate) {
//         postRatingsById.set(post.id, await postRatingPromisesById.get(post.id)!)
//     }
//     postsToRate.sort(function (a, b) {
//         return postRatingsById.get(b.id)! - postRatingsById.get(a.id)!
//     })
//     pdArray.posts = postsToRate
//     pdArray.display()
// })
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {});
function rateTag(ttr, ttrb, comTtrb) {
    return __awaiter(this, void 0, void 0, function* () {
        //returns the implied probability of ttrb given ttr. NOT RELATIVE TO COMTTRB
        const amtTtrWithTtrb = PromptCountFC.call(`${ttr} ${ttrb}`);
        const amtTtr = PromptCountFC.call(`${ttr}`);
        const prob = ((yield amtTtrWithTtrb) + 1) / ((yield amtTtr) + 2);
        const rating = prob / comTtrb;
        //add ttr to top tags
        if (ttr !== ttrb && !topTagsSet.has(ttr) && (yield amtTtrWithTtrb) > 0 && (topTagsList.length < maxTopTags || rating > topTagsList[topTagsList.length - 1].rating)) {
            topTagsSet.add(ttr);
            topTagsList.push({
                tag: ttr,
                rating: rating
            });
            topTagsList.sort(function (a, b) {
                return b.rating - a.rating;
            });
            topTagsList = topTagsList.slice(0, maxTopTags);
        }
        return rating;
    });
}
function ratePost(postToRate, ttrb, comTtrb) {
    return __awaiter(this, void 0, void 0, function* () {
        const tagRatingPromises = [];
        for (const tag of postToRate.tags.values()) {
            tagRatingPromises.push(rateTag(tag, ttrb, comTtrb));
        }
        const tagRatings = yield Promise.all(tagRatingPromises);
        let sumOfLogs = 0;
        for (const rating of tagRatings) {
            sumOfLogs += Math.log10(rating);
        }
        const avgLogs = sumOfLogs / postToRate.tags.size;
        return avgLogs;
    });
}
