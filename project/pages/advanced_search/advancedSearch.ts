import { AsyncFunctionCache } from "../../../R34-Tools/Cache/src/classes/FunctionCache/Async.js";
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { getCount } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { getPosts, getProportion } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../functions/PostDisplayArray.js";
import { smartGetElement } from "../../functions/generalFunctions.js";

window.onload = async function () {
    await resetAnchor()
}


const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const sortForEle = smartGetElement("sortFor", HTMLInputElement)
sortForEle.addEventListener("input", function () {
    rateTagF$.cache.clear()
})
const sortAgainstEle = smartGetElement("sortAgainst", HTMLInputElement)
sortAgainstEle.addEventListener("input", function () {
    rateTagF$.cache.clear()
})
const statusDisplayEle = smartGetElement("statusDiv", HTMLDivElement)
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement)
searchButtonEle.addEventListener("click", async function () {
    const literalSearchCount = await getCount(literalSearchEle.value, {})

    let amtPosts = 1
    while (amtPosts < Math.min(50000, literalSearchCount) && !searchNeedsStopped) {
        statusDisplayEle.innerText = `Redoing search with ${amtPosts} posts...`
        await search(amtPosts)
        amtPosts *= 2
    }
    statusDisplayEle.innerText = `Search stopped`
    searchNeedsStopped = false
})
const stopSearchButtonEle = smartGetElement("stopSearchButton", HTMLButtonElement)
stopSearchButtonEle.addEventListener("click", function () {
    statusDisplayEle.innerText = `Okay I'm stopping, just let me finish this...`
    searchNeedsStopped = true
})




let searchNeedsStopped = false

async function rateTag(t: string, promptFor: string, promptAgainst: string): Promise<number> {
    const propForPromise = getProportion(t, promptFor, {
        lookInCacheSubgroup: false,
        storeInCacheSubgroup: false
    })
    const propAgainstPromise = getProportion(t, promptAgainst, {
        lookInCacheSubgroup: false,
        storeInCacheSubgroup: false
    })

    const [propFor, propAgainst] = await Promise.all([propForPromise, propAgainstPromise])

    const ret = ((propFor).proportion + 1) / ((propAgainst).proportion + 1)

    console.log(`just rated the tag ${t} as ${ret}`)

    return ret
}
const rateTagF$ = new AsyncFunctionCache<number, typeof rateTag>(rateTag, 10000, 24)

async function ratePost(p: Post, promptFor: string, promptAgainst: string): Promise<number> {
    const ratingPromises: Promise<number>[] = []
    for (const tag of p.tags.values()) {
        ratingPromises.push(rateTagF$.call(tag, promptFor, promptAgainst))
    }

    const ratings: number[] = await Promise.all(ratingPromises)

    let product = 1
    for (const rating of ratings) {
        product *= rating
    }
    return Math.pow(product, 1 / p.tags.size)
}


async function search(amtPosts: number) {
    const searchedPosts = await getPosts(literalSearchEle.value, amtPosts, {})
    const promptFor = sortForEle.value
    const promptAgainst = sortAgainstEle.value


    const postRatingPromises: Promise<number>[] = [] //an array in the same order as searchedPosts
    for (const post of searchedPosts) {
        postRatingPromises.push(ratePost(post, promptFor, promptAgainst))
    }

    const postRatings: number[] = await Promise.all(postRatingPromises)

    const postIdToRating: Map<number, number> = new Map()
    for (let i = 0; i < searchedPosts.length; i++) {
        const post = searchedPosts[i]
        const rating = postRatings[i]
        postIdToRating.set(post.id, rating)
    }

    searchedPosts.sort(function (a, b) {
        return postIdToRating.get(b.id)! - postIdToRating.get(a.id)!
    })


    pdArray.posts = searchedPosts
    pdArray.currentPage = 1
    pdArray.display()
}


