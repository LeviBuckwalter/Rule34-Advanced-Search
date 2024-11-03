import { smartGetElement } from "../../functions/html_functions.js"
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js"
import { tsToId } from "../../../R34-Tools/src/functions/general_functions/id_timestamp_conversion.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js"

const postDisplayArrayEle = new PostDisplayArray([], smartGetElement("postDisplayDiv", HTMLDivElement), {})


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

    smartGetElement("promptDisplayDiv", HTMLDivElement).innerHTML = `Now searching the prompt "${prompt}":`

    const posts = (await getPosts(prompt, 10000, { lookInCache: false, storeInCache: false }))

    postDisplayArrayEle.posts = posts
    postDisplayArrayEle.display()
}

smartGetElement("searchButton", HTMLButtonElement).addEventListener("click", search)