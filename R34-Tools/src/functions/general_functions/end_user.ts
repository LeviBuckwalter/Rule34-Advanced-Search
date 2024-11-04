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
    options: {
        plusOneBuffer?: boolean,
        lookInCacheSubgroup?: boolean,
        storeInCacheSubgroup?: boolean,
        lookInCacheBaseline?: boolean,
        storeInCacheBaseline?: boolean
    } = {}
): Promise<number> {
    /*
    Gets the proportion of posts defined by promptBaseline that also fit promptSubgroup.
    So, like, if promptBaseline is "feet", and promptSubgroup is "green_eyes", this would answer the question "what proportion of foot posts are tagged green eyes".
    */

    const {
        plusOneBuffer = false,
        lookInCacheSubgroup = true,
        storeInCacheSubgroup = true,
        lookInCacheBaseline = true,
        storeInCacheBaseline = true
    } = options

    const countBl = getCount(promptBaseline, {
        lookInCache: lookInCacheBaseline,
        storeInCache: storeInCacheBaseline
    })
    const countSg = getCount(`${promptBaseline} ${promptSubgroup}`, {
        lookInCache: lookInCacheSubgroup,
        storeInCache: storeInCacheSubgroup
    })
    const buffer = (plusOneBuffer) ? 1 : 0
    return (await countSg + buffer) / (await countBl + buffer)
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

export async function getCommonness(tag: string): Promise<number> {
    //returns the proportion of posts on the site with the given tag

    const amtAllPosts = getCount("", {})
    const amtPostsTag = getCount(tag, {})
    return (await amtPostsTag) / (await amtAllPosts)
}