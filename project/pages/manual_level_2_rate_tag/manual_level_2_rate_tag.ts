import { roundTo } from "../../functions/general_functions.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
import { rateTagLvl2 } from "../../functions/post_rating/post_rating.js";

const tagToRateEle = smartGetElement("tagToRate", HTMLInputElement)
const tagToRateByEle = smartGetElement("tagToRateBy", HTMLInputElement)
const rateButtonEle = smartGetElement("rateButton", HTMLButtonElement)
const answerDivEle = smartGetElement("answerDiv", HTMLDivElement)

rateButtonEle.addEventListener("click", async function () {
    const ttr = tagToRateEle.value
    const ttrb = tagToRateByEle.value

    // answerDivEle.replaceChildren()
    answerDivEle.appendChild(toHtml(smartEl("div", {}, [`The level 2 implication from "${ttr}" to "${ttrb}" is: `])))
    answerDivEle.appendChild(toHtml(smartEl("span", {}, [`${roundTo((await rateTagLvl2(ttr, ttrb)) * 100, 3)}%`])))
})