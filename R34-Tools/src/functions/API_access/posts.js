var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { processRawPosts } from "../general_functions/utility_functions.js";
import { FC } from "./the_fetch_conductor.js";
export function postsApi(prompt, pid, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        pid = (pid === undefined) ? 0 : pid;
        limit = (limit === undefined) ? 1000 : limit;
        const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${prompt}&pid=${pid}&limit=${limit}&json=1`;
        function myEgg() {
            return __awaiter(this, void 0, void 0, function* () {
                const resp = yield fetch(url);
                return processRawPosts(yield resp.json());
            });
        }
        const ret = yield FC.ticket(myEgg);
        return ret;
    });
}
