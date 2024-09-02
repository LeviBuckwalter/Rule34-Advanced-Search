import { smartGetElement } from "../../functions/generalFunctions.js";
import { ratePost } from "../../../R34-Tools/src/testing/rate_post.js"
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js"
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";

window.onload = resetAnchor

async function rate() {
    // await resetAnchor()

    const postId = Number(smartGetElement("postId", HTMLInputElement).value)

    const post = (await getPosts(`id:${postId}`, 1, { lookInCache: false, storeInCache: false }))[0]
    smartGetElement("r34pic", HTMLImageElement).src = post.thumbnailUrl
    smartGetElement("r34picLink", HTMLAnchorElement).href = post.siteUrl

    const rating = await ratePost(
        postId,
        smartGetElement("tagToRateBy", HTMLInputElement).value,
        Number(smartGetElement("tupleSize", HTMLInputElement).value),
        Number(smartGetElement("amtTuples", HTMLInputElement).value)
    )
    console.log(rating)

}

smartGetElement("rateButton", HTMLButtonElement).addEventListener("click", rate)

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