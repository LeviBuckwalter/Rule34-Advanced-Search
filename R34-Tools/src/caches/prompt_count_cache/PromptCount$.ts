import { Cache } from "../../../Cache/src/classes/Cache.js"
import { AsyncFunctionCache } from "../../../Cache/src/classes/FunctionCache/Async.js"
import { normalizePrompt } from "../../functions/general_functions/utility_functions.js"
import { getCountWithoutCache } from "./PromptCount$_functions.js"

// export const PromptCount$: Cache<Promise<number>> = new Cache(50000)
// PromptCount$.makeKey = function (prompt: string): string {
//     prompt = normalizePrompt(prompt)
//     const key = prompt.replace(" ", "-")
//     return key
// }

export const PromptCountFC: AsyncFunctionCache<number, typeof getCountWithoutCache> = new AsyncFunctionCache(getCountWithoutCache, 50000, 24)