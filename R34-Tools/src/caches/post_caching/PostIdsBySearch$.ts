import { Cache } from "../../../Cache/src/classes/Cache.js"
import { normalizePrompt } from "../../functions/general_functions/utility_functions.js"
import { General$ } from "../General$.js"
import { PostsByPostId$ } from "./PostsByPostId$.js"

/*
stores the results of specific searches. This cache doesn't store any actual posts, just postIds. If someone asks for the results of a given search, and this cache has an entry for it, but not every post has an entry in the PostsByPostIds cache, then this cache will delete its entry and return undefined.

This cache's size is unlimited, because I'm assuming the PostsByPostIds cache will limit its own size, and thereby keep this cache from growing past a certain point.
*/

type postId = number
export const PostIdsBySearch$: Cache<postId[]> = new Cache("PostIdsBySearch$", Infinity)
PostIdsBySearch$.makeKey = function (prompt: string, pid: number): string {
    // const Gen$Ret = General$.retrieve("maxId")
    // if (!Gen$Ret) {
    //     throw new Error(`maxId is undefined. You probably need to reset the anchor`)
    // }
    let key = normalizePrompt(prompt)
    // key = `id:<${Gen$Ret} ${prompt}`
    key = `${prompt.replace(" ", "-")}_${pid}`
    return key
}
PostIdsBySearch$.retrieve = function (key: string): number[] | undefined {
    const originalRetrieve: (key: string) => number[] | undefined = Cache.prototype.retrieve.bind(this)
    const originalRet = originalRetrieve(key)
    if (originalRet) {
        for (const id of originalRet) {
            const key = PostsByPostId$.makeKey(id)
            const posts$Ret = PostsByPostId$.retrieve(key)
            if (!posts$Ret) {
                PostIdsBySearch$.discard(key)
                return undefined
            }
        }
    }
    return originalRet
}