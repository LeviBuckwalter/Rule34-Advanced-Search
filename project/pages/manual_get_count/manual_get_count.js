var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCount } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
const promptSubgroupEle = smartGetElement("promptSubgroup", HTMLInputElement);
const promptBaselineEle = smartGetElement("promptBaseline", HTMLInputElement);
const goButtonEle = smartGetElement("goButton", HTMLButtonElement);
goButtonEle.addEventListener("click", goButtonFunc);
const returnDivEle = smartGetElement("returnDiv", HTMLDivElement);
function goButtonFunc() {
    return __awaiter(this, void 0, void 0, function* () {
        const promptBl = promptBaselineEle.value;
        const promptSg = promptSubgroupEle.value;
        const countAll = getCount("", { lookInCache: false, storeInCache: false });
        const countBl = getCount(promptBl, { lookInCache: false, storeInCache: false });
        const countSg = getCount(promptSg, { lookInCache: false, storeInCache: false });
        const countSgInBl = getCount(`${promptSg} ${promptBl}`, { lookInCache: false, storeInCache: false });
        returnDivEle.replaceChildren(); //clears children
        returnDivEle.appendChild(toHtml(smartEl("div", {}, [`Count of "${promptSg}" in "${promptBl}": ${yield countSgInBl}`])));
        returnDivEle.appendChild(toHtml(smartEl("div", {}, [`Count of "${promptBl}": ${yield countBl}`])));
        returnDivEle.appendChild(toHtml(smartEl("div", {}, [`Count of "${promptSg}": ${yield countSg}`])));
        returnDivEle.appendChild(toHtml(smartEl("div", {}, [`Count of all posts: ${yield countAll}`])));
    });
}
