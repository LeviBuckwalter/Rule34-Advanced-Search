var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { smartGetElement } from "../../functions/generalFunctions.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { tsToId } from "../../../R34-Tools/src/functions/general_functions/id_timestamp_conversion.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
const postDisplayArrayEle = new PostDisplayArray([], smartGetElement("postDisplayDiv", HTMLDivElement), {});
function search() {
    return __awaiter(this, void 0, void 0, function* () {
        const constraints = smartGetElement("constraints", HTMLInputElement).value + " ";
        const sort = smartGetElement("sortInput", HTMLSelectElement).value;
        let idConstraints = "";
        const timeInputEarliest = smartGetElement("timeInputEarliest", HTMLInputElement).value;
        if (timeInputEarliest !== "") {
            const minId = tsToId(Date.parse(smartGetElement("timeInputEarliest", HTMLInputElement).value) / 1000);
            idConstraints += `id:>${minId} `;
        }
        const timeInputLatest = smartGetElement("timeInputLatest", HTMLInputElement).value;
        if (timeInputLatest !== "") {
            const maxId = tsToId(Date.parse(smartGetElement("timeInputLatest", HTMLInputElement).value) / 1000);
            idConstraints += `id:<${maxId} `;
        }
        const prompt = constraints + idConstraints + sort;
        smartGetElement("promptDisplayDiv", HTMLDivElement).innerHTML = `Now searching the prompt "${prompt}":`;
        const posts = (yield getPosts(prompt, 10000, { lookInCache: false, storeInCache: false }));
        postDisplayArrayEle.posts = posts;
        postDisplayArrayEle.display();
    });
}
smartGetElement("searchButton", HTMLButtonElement).addEventListener("click", search);
