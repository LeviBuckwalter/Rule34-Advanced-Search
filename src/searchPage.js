var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { smartGetElement } from "./functions.js";
import { getPosts } from "../R34-Tools/src/functions/general_functions/end_user.js";
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { tsToId } from "../R34-Tools/src/functions/general_functions/id_timestamp_conversion.js";
window.onload = resetAnchor;
function search() {
    return __awaiter(this, void 0, void 0, function* () {
        const constraints = smartGetElement("constraints", HTMLInputElement).value + " ";
        const sort = smartGetElement("sortInput", HTMLSelectElement).value;
        let idConstraints = "";
        const timeInputEarliest = smartGetElement("timeInputEarliest", HTMLInputElement).value;
        if (timeInputEarliest !== "") {
            const minId = tsToId(Date.parse(smartGetElement("timeInputEarliest", HTMLInputElement).value) / 1000);
            idConstraints += `id:>${minId} `;
        }
        const timeInputLatest = smartGetElement("timeInputLatest", HTMLInputElement).value;
        if (timeInputLatest !== "") {
            const maxId = tsToId(Date.parse(smartGetElement("timeInputLatest", HTMLInputElement).value) / 1000);
            idConstraints += `id:<${maxId} `;
        }
        const prompt = constraints + idConstraints + sort;
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
    });
}
smartGetElement("searchButton", HTMLButtonElement).addEventListener("click", search);
