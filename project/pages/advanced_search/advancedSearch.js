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
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { Searcher } from "../../classes/Searcher.js";
import { smartGetElement } from "../../functions/generalFunctions.js";
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
    });
};
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement);
const sortForEle = smartGetElement("sortFor", HTMLInputElement);
const statusDisplayEle = smartGetElement("statusDiv", HTMLDivElement);
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement);
searchButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const searchForPrompt = sortForEle.value;
        searcher = new Searcher(new SortedSample(yield getPosts("", 10000, { storeInCache: false })), new Census(yield getPosts(searchForPrompt, 1000, { storeInCache: false })), searchForPrompt, literalSearchEle.value, function () {
            pdArray.posts = searcher.sortedPosts;
            pdArray.display();
        });
        searcher.go();
    });
});
const stopSearchButtonEle = smartGetElement("stopSearchButton", HTMLButtonElement);
stopSearchButtonEle.addEventListener("click", function () {
    searcher.stop();
});
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {});
let searcher = undefined;
let searchNeedsStopped = false;
