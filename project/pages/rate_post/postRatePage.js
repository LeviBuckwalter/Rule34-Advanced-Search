var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { smartGetElement } from "../../functions/generalFunctions.js";
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () { yield resetAnchor(); });
};
const rateByTagEle = smartGetElement("rateByTag", HTMLInputElement);
const postToRateId = smartGetElement("postId", HTMLInputElement);
const postDisplayDiv = smartGetElement("postDisplayDiv", HTMLDivElement);
const explenationDiv = smartGetElement("explenationDiv", HTMLDivElement);
// smartGetElement("rateButton", HTMLButtonElement).addEventListener("click", async function () {
//     const postToRateById = Number(postToRateId.value)
//     const postToRate = (await getPosts(`id:${postToRateById}`, 1, {}))[0]
//     postDisplayDiv.innerHTML = ""
//     const PD = new PostDisplay(postToRate, postDisplayDiv)
//     const pr = new PostRater(
//         new SortedSample(await getPosts("", 10000, {})),
//         new Census(await getPosts(rateByTagEle.value, 1000, {})),
//         rateByTagEle.value
//     )
//     pr.ratePost(postToRate, 2, explenationDiv)
// })
//////////////////////////////////////////////////////////////
// function html(elementName: string, attributes: {[name: string]: string}, children: any[] = []): any {
//     return { elementName, attributes, children }
// }
// html("section", {}, [
//     html("div", {}, [
//         html("label", {"for": "postId"}, [
//             "What's the id of the post you want to rate?"
//         ]),
//         html("input", {"type": "text", "id": "postId"})
//     ])
// ])
// function buildHtmlFromObj(element: any): HTMLElement {}
