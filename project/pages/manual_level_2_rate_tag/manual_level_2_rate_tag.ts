import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
import { rateTagLvl2 } from "../../functions/post_rating.js";

const tagToRateEle = smartGetElement("tagToRate", HTMLInputElement)
const tagToRateByEle = smartGetElement("tagToRateBy", HTMLInputElement)
const rateButtonEle = smartGetElement("rateButton", HTMLButtonElement)
const answerDivEle = smartGetElement("answerDiv", HTMLDivElement)

rateButtonEle.addEventListener("click", async function () {
    const ttr = tagToRateEle.value
    const ttrb = tagToRateByEle.value

    answerDivEle.replaceChildren()
    answerDivEle.appendChild(toHtml(smartEl("span", {}, [`The level 2 percent implication from "${ttr}" to "${ttrb}" is: `])))
    answerDivEle.appendChild(toHtml(smartEl("span", {}, [`${(await rateTagLvl2(ttr, ttrb)) * 100}%`])))
})