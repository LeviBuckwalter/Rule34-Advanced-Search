var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { l2TagRater } from "../../classes/L2TagRater.js";
import { roundTo } from "../../functions/general_functions.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
const tagToRateByEle = smartGetElement("tagToRateBy", HTMLInputElement);
const createRaterButtonEle = smartGetElement("createRaterButton", HTMLButtonElement);
const tagToRateEle = smartGetElement("tagToRate", HTMLInputElement);
const rateButtonEle = smartGetElement("rateButton", HTMLButtonElement);
const answerDivEle = smartGetElement("answerDiv", HTMLDivElement);
let tagRater = undefined;
let ttrb = undefined;
createRaterButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        ttrb = tagToRateByEle.value;
        tagRater = new l2TagRater(ttrb);
        tagRater.init();
        console.log(tagRater.initialized);
    });
});
rateButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tagRater || !ttrb) {
            return;
        }
        if (!tagRater.initialized) {
            console.log("Tag rater is not finished initializing");
            return;
        }
        const ttr = tagToRateEle.value;
        const rating = tagRater.rate(ttr);
        // answerDivEle.replaceChildren()
        answerDivEle.appendChild(toHtml(smartEl("div", {}, [`The level 2 implication from "${ttr}" to "${ttrb}" is: `])));
        answerDivEle.appendChild(toHtml(smartEl("span", {}, [`${roundTo((yield rating) * 100, 3)}%`])));
    });
});
