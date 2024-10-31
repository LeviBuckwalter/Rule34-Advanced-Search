import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/generalFunctions.js";

const promptInputEle = smartGetElement("promptInput", HTMLInputElement)
const sizeInputEle = smartGetElement("sizeInput", HTMLInputElement)
const goButtonEle = smartGetElement("goButton", HTMLButtonElement)
const returnDivEle = smartGetElement("returnDiv", HTMLDivElement)

goButtonEle.addEventListener("click", async function () {
    returnDivEle.replaceChildren()//clears children
    returnDivEle.appendChild(toHtml("Fetching posts..."))


    const prompt = promptInputEle.value
    const maxPosts = Number(sizeInputEle.value)
    const census = new Census(await getPosts(prompt, maxPosts, { lookInCache: false, storeInCache: false }))

    // console.log(census.toArray(100))

    returnDivEle.replaceChildren()//clears children
    //amt tags:
    returnDivEle.appendChild(toHtml(smartEl("div", {}, [`Amount of distinct tags in sample: ${census.counts.size}`])))
    //counts:
    for (const { tag, count } of census.toArray()) {
        returnDivEle.appendChild(toHtml(smartEl("div", {}, [`tag: "${tag}", count: ${count}`])))
    }
})