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
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { smartGetElement } from "../../functions/html_functions.js";
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const amtPostsEle = smartGetElement("amtPosts", HTMLInputElement);
const sortForEle = smartGetElement("sortFor", HTMLInputElement);
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement);
searchButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const searchForPrompt = sortForEle.value;
        const literalSearchPrompt = literalSearchEle.value;
        if (amtPostsEle.value === "") {
            amtPostsEle.value = `${100}`;
        }
        const amtPostsNum = Number(amtPostsEle.value);
        const postsToRate = yield getPosts(literalSearchPrompt, amtPostsNum, {});
        const postRatingPromisesById = new Map();
        for (const post of postsToRate) {
            postRatingPromisesById.set(post.id, ratePost(post));
        }
        const postRatingsById = new Map();
        for (const post of postsToRate) {
            postRatingsById.set(post.id, yield postRatingPromisesById.get(post.id));
        }
        postsToRate.sort(function (a, b) {
            return postRatingsById.get(b.id) - postRatingsById.get(a.id);
        });
        pdArray.posts = postsToRate;
        pdArray.display();
        function ratePost(post) {
            return __awaiter(this, void 0, void 0, function* () {
                const tagRatingIngredients = [];
                for (const tag of post.tags.values()) {
                    tagRatingIngredients.push({
                        amtPostsWith: PromptCountFC.call(`${tag} ${searchForPrompt}`),
                        amtPostsTotal: PromptCountFC.call(`${tag}`)
                    });
                }
                let sum = 0;
                for (const obj of tagRatingIngredients) {
                    const amtPostsWithout = (yield obj.amtPostsTotal) - (yield obj.amtPostsWith);
                    sum += ((yield obj.amtPostsWith) + 1) / (amtPostsWithout + 1);
                }
                const rating = sum / post.tags.size;
                console.log(`rating of ${rating}: ${post.siteUrl}`);
                return rating;
            });
        }
    });
});
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {});
