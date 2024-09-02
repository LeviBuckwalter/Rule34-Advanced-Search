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
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../functions/PostDisplayArray.js";
import { smartGetElement } from "../../functions/generalFunctions.js";
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const sortForEle = smartGetElement("sortFor", HTMLInputElement);
const sortAgainsetEle = smartGetElement("sortAgainst", HTMLInputElement);
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {});
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement);
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
searchButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const searchedPosts = getPosts(literalSearchEle.value, 30000, {});
        const postsFor = getPosts(sortForEle.value, 10000, {});
        const postsAgainst = getPosts(sortAgainsetEle.value, 10000, {});
        const censusFor = new Census(yield postsFor);
        const censusAgainst = new Census(yield postsAgainst);
        // console.log(`searchedPosts: ${(await searchedPosts).length}`)
        // console.log(`postsFor: ${(await postsFor).length}`)
        // console.log(`postsAgainst: ${(await postsAgainst).length}`)
        // const postsToRateBy: { post: Post, score: number }[] = []
        // for (const post of (await postsFor)) {
        //     postsToRateBy.push({
        //         post: post,
        //         score: 1
        //     })
        // }
        // for (const post of (await postsAgainst)) {
        //     postsToRateBy.push({
        //         post: post,
        //         score: -1
        //     })
        // }
        const ratedPosts = [];
        for (const post of (yield searchedPosts)) {
            let rating = 0;
            for (const tag of post.tags.values()) {
                rating += (censusFor.count(tag) + 1) / (censusAgainst.count(tag) + 1);
            }
            ratedPosts.push({
                post: post,
                rating: rating
            });
        }
        ratedPosts.sort(function (a, b) {
            return b.rating - a.rating;
        });
        const sortedPosts = [];
        for (const { post } of ratedPosts) {
            sortedPosts.push(post);
        }
        pdArray.posts = sortedPosts;
        pdArray.currentPage = 1;
        pdArray.display();
    });
});
