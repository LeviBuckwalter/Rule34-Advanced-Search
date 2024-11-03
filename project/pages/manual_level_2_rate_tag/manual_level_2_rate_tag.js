var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
import { rateTagLvl2 } from "../../functions/post_rating.js";
const tagToRateEle = smartGetElement("tagToRate", HTMLInputElement);
const tagToRateByEle = smartGetElement("tagToRateBy", HTMLInputElement);
const rateButtonEle = smartGetElement("rateButton", HTMLButtonElement);
const answerDivEle = smartGetElement("answerDiv", HTMLDivElement);
rateButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const ttr = tagToRateEle.value;
        const ttrb = tagToRateByEle.value;
        answerDivEle.replaceChildren();
        answerDivEle.appendChild(toHtml(smartEl("span", {}, [`${(yield rateTagLvl2(ttr, ttrb)) * 100}%`])));
    });
});
