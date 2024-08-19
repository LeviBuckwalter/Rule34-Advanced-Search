import { Cache } from "../../../Cache/src/classes/Cache.js";
import { normalizePrompt } from "../../functions/general_functions/utility_functions.js";
import { PostsByPostId$ } from "./PostsByPostId$.js";
export const PostIdsBySearch$ = new Cache("PostIdsBySearch$", Infinity);
PostIdsBySearch$.makeKey = function (prompt, pid) {
    // const Gen$Ret = General$.retrieve("maxId")
    // if (!Gen$Ret) {
    //     throw new Error(`maxId is undefined. You probably need to reset the anchor`)
    // }
    let key = normalizePrompt(prompt);
    // key = `id:<${Gen$Ret} ${prompt}`
    key = `${prompt.replace(" ", "-")}_${pid}`;
    return key;
};
PostIdsBySearch$.retrieve = function (key) {
    const originalRetrieve = Cache.prototype.retrieve.bind(this);
    const originalRet = originalRetrieve(key);
    if (originalRet) {
        for (const id of originalRet) {
            const key = PostsByPostId$.makeKey(id);
            const posts$Ret = PostsByPostId$.retrieve(key);
            if (!posts$Ret) {
                PostIdsBySearch$.discard(key);
                return undefined;
            }
        }
    }
    return originalRet;
};
