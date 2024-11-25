import { l2TagRaterV2 } from "../../classes/L2TagRaterV2.js";
import { roundTo } from "../../functions/general_functions.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";

const tagToRateByEle = smartGetElement("tagToRateBy", HTMLInputElement)
const ttrCensusSizeEle = smartGetElement("ttrCensusSize", HTMLInputElement)
const formulaFirstTermEle = smartGetElement("formulaFirstTerm", HTMLInputElement)
const createRaterButtonEle = smartGetElement("createRaterButton", HTMLButtonElement)
const tagToRateEle = smartGetElement("tagToRate", HTMLInputElement)
const rateButtonEle = smartGetElement("rateButton", HTMLButtonElement)
const answerDivEle = smartGetElement("answerDiv", HTMLDivElement)

let tagRater: undefined | l2TagRaterV2 = undefined
let ttrb: undefined | string = undefined

createRaterButtonEle.addEventListener("click", async function () {
    ttrb = tagToRateByEle.value
    const ttrCensusSize = (ttrCensusSizeEle.value === "") ? undefined : Number(ttrCensusSizeEle.value)
    const formulaFirstTerm = formulaFirstTermEle.checked
    tagRater = new l2TagRaterV2(ttrb)
    tagRater.init()
    console.log(tagRater.initialized)
})

rateButtonEle.addEventListener("click", async function () {
    if (!tagRater || !ttrb) {
        console.log("A tag rater must be created before rating a tag")
        return
    }
    if (!tagRater.initialized) {
        console.log("Tag rater is not finished initializing")
        return
    }
    console.log(tagRater.initialized)

    const ttr = tagToRateEle.value
    const rating = tagRater.rateTag(ttr)

    // answerDivEle.replaceChildren()
    answerDivEle.appendChild(toHtml(smartEl("div", {}, [`The level 2 implication from "${ttr}" to "${ttrb}" is: `])))
    answerDivEle.appendChild(toHtml(smartEl("span", {}, [`${roundTo((await rating) * 100, 3)}%`])))
})