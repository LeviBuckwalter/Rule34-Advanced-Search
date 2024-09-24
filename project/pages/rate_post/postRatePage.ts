import { smartGetElement } from "../../functions/generalFunctions.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js"
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { PostRater } from "../../classes/PostRater.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { PostDisplay } from "../../classes/PostDisplay.js";

window.onload = async function () { await resetAnchor() }


const rateByTagEle = smartGetElement("rateByTag", HTMLInputElement)
const postToRateId = smartGetElement("postId", HTMLInputElement)
const postDisplayDiv = smartGetElement("postDisplayDiv", HTMLDivElement)
const explenationDiv = smartGetElement("explenationDiv", HTMLDivElement)
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