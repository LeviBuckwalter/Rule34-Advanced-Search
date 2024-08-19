import { getPosts } from "r34-tools/src/functions/general_functions/end_user.js"
import { smartGetElement } from "./functions.js"
import { resetAnchor } from "r34-tools/src/caches/post_caching/post_caching_functions.js";

window.onload = resetAnchor

async function search() {
    const constraints = smartGetElement("constraints", HTMLInputElement).value
    const sort = smartGetElement("sortInput", HTMLSelectElement).value
    const prompt = constraints + " " + sort
    const posts = (await getPosts(prompt, 100, {}))

    smartGetElement("imageSection", HTMLElement).innerHTML = ""
    for (const post of posts) {
        const linkElement = document.createElement("a")
        linkElement.href = post.siteUrl
        linkElement.target = "_blank"
        smartGetElement("imageSection", HTMLElement).appendChild(linkElement)

        const imageElement = document.createElement("img")
        imageElement.src = post.thumbnailUrl
        linkElement.appendChild(imageElement)
    }

    // smartGetElement("r34Pic", HTMLImageElement).src = post.thumbnailUrl
    // smartGetElement("r34PicLink", HTMLAnchorElement).href = post.siteUrl
}

smartGetElement("searchButton", HTMLButtonElement).addEventListener("click", search)