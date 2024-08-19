var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getPosts } from "r34-tools/src/functions/general_functions/end_user.js";
import { smartGetElement } from "./functions.js";
import { resetAnchor } from "r34-tools/src/caches/post_caching/post_caching_functions.js";
window.onload = resetAnchor;
function search() {
    return __awaiter(this, void 0, void 0, function* () {
        const constraints = smartGetElement("constraints", HTMLInputElement).value;
        const sort = smartGetElement("sortInput", HTMLSelectElement).value;
        const prompt = constraints + " " + sort;
        const posts = (yield getPosts(prompt, 100, {}));
        smartGetElement("imageSection", HTMLElement).innerHTML = "";
        for (const post of posts) {
            const linkElement = document.createElement("a");
            linkElement.href = post.siteUrl;
            linkElement.target = "_blank";
            smartGetElement("imageSection", HTMLElement).appendChild(linkElement);
            const imageElement = document.createElement("img");
            imageElement.src = post.thumbnailUrl;
            linkElement.appendChild(imageElement);
        }
        // smartGetElement("r34Pic", HTMLImageElement).src = post.thumbnailUrl
        // smartGetElement("r34PicLink", HTMLAnchorElement).href = post.siteUrl
    });
}
smartGetElement("searchButton", HTMLButtonElement).addEventListener("click", search);
