import { Post } from "../../classes/Post.js"
import { postsApiWithCache } from "../../caches/post_caching/post_caching_functions.js"
import { getCount } from "../../caches/prompt_count_cache/PromptCount$_functions.js"

export async function getPosts(
    prompt: string,
    amtPosts: number,
    options: {
        lookInCache?: boolean,
        storeInCache?: boolean
    }
): Promise<Post[]> {
    const { lookInCache = true, storeInCache = true } = options

    const pages = Math.ceil(amtPosts / 1000)
    const promises: Promise<Post[]>[] = []
    for (let pid = 0; pid < pages; pid++) {
        promises.push(postsApiWithCache(prompt, pid, { lookInCache, storeInCache }))
    }
    const posts: Post[] = []
    for (const promise of promises) {
        posts.push(...(await promise))
    }

    return posts.slice(0, amtPosts)
}

// export async function validTags(...tags: string[]): Promise<boolean> {
//     const promises: Promise<number>[] = []
//     for (const tag of tags) {
//         promises.push(countWithCache(tag))
//     }
//     for (const promise of promises) {
//         if ((await promise) === 0) {
//             return false
//         }
//     }//else:
//     return true
// }

export async function getProportion(
    promptSubgroup: string,
    promptBaseline: string,
    options: { lookInCache?: boolean, storeInCache?: boolean } = {}
): Promise<{ proportion: number, datapoints: number }> {
    const { lookInCache = true, storeInCache = true } = options

    const countBl = getCount(promptBaseline, { lookInCache, storeInCache })
    const countSg = getCount(`${promptBaseline} ${promptSubgroup}`, { lookInCache, storeInCache })
    return {
        proportion: (await countSg) / (await countBl),
        datapoints: await countBl
    }
}

export async function getRelativeProportion(
    promptSubgroup: string,
    promptBaseline: string,
    options: { lookInCache?: boolean, storeInCache?: boolean }
): Promise<{ relativeProportion: number, datapoints: number }> {
    const { lookInCache = true, storeInCache = true } = options

    const countAll = getCount("", { lookInCache, storeInCache })
    const countBl = getCount(promptBaseline, { lookInCache, storeInCache })
    const countSgIndependant = getCount(promptSubgroup, { lookInCache, storeInCache })
    const countSg = getCount(`${promptBaseline} ${promptSubgroup}`, { lookInCache, storeInCache })

    return {
        relativeProportion: ((await countSg) / (await countBl)) / ((await countSgIndependant) / (await countAll)),
        datapoints: await countBl
    }
}