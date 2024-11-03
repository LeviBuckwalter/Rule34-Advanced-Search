import { getCount } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";

const promptSubgroupEle = smartGetElement("promptSubgroup", HTMLInputElement)
const promptBaselineEle = smartGetElement("promptBaseline", HTMLInputElement)
const goButtonEle = smartGetElement("goButton", HTMLButtonElement)
goButtonEle.addEventListener("click", goButtonFunc)
const returnDivEle = smartGetElement("returnDiv", HTMLDivElement)

async function goButtonFunc() {
    const promptBl = promptBaselineEle.value
    const promptSg = promptSubgroupEle.value


    const countAll = getCount("", { lookInCache: false, storeInCache: false })
    const countBl = getCount(promptBl, { lookInCache: false, storeInCache: false })
    const countSg = getCount(promptSg, { lookInCache: false, storeInCache: false })
    const countSgInBl = getCount(`${promptSg} ${promptBl}`, { lookInCache: false, storeInCache: false })


    returnDivEle.replaceChildren()//clears children
    returnDivEle.appendChild(
        toHtml(
            smartEl(
                "div",
                {},
                [`Count of "${promptSg}" in "${promptBl}": ${await countSgInBl}`]
            )
        )
    )
    returnDivEle.appendChild(
        toHtml(
            smartEl(
                "div",
                {},
                [`Count of "${promptBl}": ${await countBl}`]
            )
        )
    )
    returnDivEle.appendChild(
        toHtml(
            smartEl(
                "div",
                {},
                [`Count of "${promptSg}": ${await countSg}`]
            )
        )
    )
    returnDivEle.appendChild(
        toHtml(
            smartEl(
                "div",
                {},
                [`Count of all posts: ${await countAll}`]
            )
        )
    )




}