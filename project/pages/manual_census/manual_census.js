var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";
const promptInputEle = smartGetElement("promptInput", HTMLInputElement);
const sizeInputEle = smartGetElement("sizeInput", HTMLInputElement);
const goButtonEle = smartGetElement("goButton", HTMLButtonElement);
const returnDivEle = smartGetElement("returnDiv", HTMLDivElement);
goButtonEle.addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        returnDivEle.replaceChildren(); //clears children
        returnDivEle.appendChild(toHtml("Fetching posts..."));
        const prompt = promptInputEle.value;
        const maxPosts = Number(sizeInputEle.value);
        const census = new Census(yield getPosts(prompt, maxPosts, { lookInCache: false, storeInCache: false }));
        // console.log(census.toArray(100))
        returnDivEle.replaceChildren(); //clears children
        //amt tags:
        returnDivEle.appendChild(toHtml(smartEl("div", {}, [`Amount of distinct tags in sample: ${census.counts.size}`])));
        //counts:
        for (const { tag, count } of census.toArray()) {
            returnDivEle.appendChild(toHtml(smartEl("div", {}, [`tag: "${tag}", count: ${count}`])));
        }
    });
});
