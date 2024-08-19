import { smartGetElement } from "./functions.js"
import { getPosts } from "../R34-Tools/src/functions/general_functions/end_user.js"
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { tsToId } from "../R34-Tools/src/functions/general_functions/id_timestamp_conversion.js";

// window.onload = resetAnchor

async function search() {
    const constraints = smartGetElement("constraints", HTMLInputElement).value + " "
    const sort = smartGetElement("sortInput", HTMLSelectElement).value

    let idConstraints = ""
    const timeInputEarliest = smartGetElement("timeInputEarliest", HTMLInputElement).value
    if (timeInputEarliest !== "") {
        const minId = tsToId(Date.parse(smartGetElement("timeInputEarliest", HTMLInputElement).value) / 1000)
        idConstraints += `id:>${minId} `
    }
    const timeInputLatest = smartGetElement("timeInputLatest", HTMLInputElement).value
    if (timeInputLatest !== "") {
        const maxId = tsToId(Date.parse(smartGetElement("timeInputLatest", HTMLInputElement).value) / 1000)
        idConstraints += `id:<${maxId} `
    }

    const prompt = constraints + idConstraints + sort

    smartGetElement("imageSection", HTMLElement).innerHTML = ""
    smartGetElement("promptDisplayDiv", HTMLDivElement).innerHTML = `Now searching the prompt "${prompt}":`

    const posts = (await getPosts(prompt, 100, { lookInCache: false, storeInCache: false }))


    for (const post of posts) {
        const linkElement = document.createElement("a")
        linkElement.href = post.siteUrl
        linkElement.target = "_blank"
        smartGetElement("imageSection", HTMLElement).appendChild(linkElement)

        const imageElement = document.createElement("img")
        imageElement.src = post.thumbnailUrl
        linkElement.appendChild(imageElement)
    }
}

smartGetElement("searchButton", HTMLButtonElement).addEventListener("click", search)