import { FC } from "../../functions/API_access/the_fetch_conductor.js"
import { PromptCount$ } from "./PromptCount$.js"

export async function getCount(
    prompt: string,
    options: {
        lookInCache?: boolean,
        storeInCache?: boolean
    }
): Promise<number> {
    const {lookInCache = true, storeInCache = true} = options
    
    const key = PromptCount$.makeKey(prompt)
    if (lookInCache) {
        const pc$Ret = PromptCount$.retrieve(key)
        if (pc$Ret) {
            return pc$Ret
        }
    }//else:

    const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${prompt}&pid=0&limit=1`
    async function myEgg(): Promise<string> {
        const resp = await fetch(url)
        return await resp.text()
    }
    const text: string | null = await FC.ticket(myEgg)
    const m = text.match(/<posts count="\d*/)
    let ret
    if (m === null) {
        throw new Error("posts count was not found in corpus")
    } else {
        ret = Number(m[0].replace(`<posts count="`, ""))
    }

    if (storeInCache) {
        PromptCount$.store(key, ret, 1000*60*60*24*7)
    }
    return ret
}