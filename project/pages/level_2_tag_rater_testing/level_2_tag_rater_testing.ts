import { l2TagRater } from "../../classes/L2TagRater.js";
import { roundTo } from "../../functions/general_functions.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
import { rateTagLvl2 } from "../../functions/post_rating/post_rating.js";

const tagToRateByEle = smartGetElement("tagToRateBy", HTMLInputElement)
const createRaterButtonEle = smartGetElement("createRaterButton", HTMLButtonElement)
const tagToRateEle = smartGetElement("tagToRate", HTMLInputElement)
const rateButtonEle = smartGetElement("rateButton", HTMLButtonElement)
const answerDivEle = smartGetElement("answerDiv", HTMLDivElement)

let tagRater: undefined | l2TagRater = undefined
let ttrb: undefined | string = undefined

createRaterButtonEle.addEventListener("click", async function () {
    ttrb = tagToRateByEle.value
    tagRater = new l2TagRater(ttrb)
    tagRater.init()
    console.log(tagRater.initialized)
})

rateButtonEle.addEventListener("click", async function () {
    if (!tagRater || !ttrb) { return }
    if (!tagRater.initialized) {
        console.log("Tag rater is not finished initializing")
        return
    }

    const ttr = tagToRateEle.value
    const rating = tagRater.rate(ttr)

    // answerDivEle.replaceChildren()
    answerDivEle.appendChild(toHtml(smartEl("div", {}, [`The level 2 implication from "${ttr}" to "${ttrb}" is: `])))
    answerDivEle.appendChild(toHtml(smartEl("span", {}, [`${roundTo((await rating) * 100, 3)}%`])))
})