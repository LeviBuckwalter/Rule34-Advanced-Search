import { AsyncFunctionCache } from "../../../R34-Tools/Cache/src/classes/FunctionCache/Async.js";
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { getCount } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../functions/PostDisplayArray.js";
import { smartGetElement } from "../../functions/generalFunctions.js";
import { Cache } from "../../../R34-Tools/Cache/src/classes/Cache.js";

window.onload = async function () {
    await resetAnchor()
}


const alwaysUseCensusCBEle = smartGetElement("alwaysUseCensusCheckbox", HTMLInputElement)
const censusSizeEle = smartGetElement("censusSizeInput", HTMLInputElement)
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const sortForEle = smartGetElement("sortFor", HTMLInputElement)
const sortAgainstEle = smartGetElement("sortAgainst", HTMLInputElement)
const statusDisplayEle = smartGetElement("statusDiv", HTMLDivElement)
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement)
searchButtonEle.addEventListener("click", async function () {
    statusDisplayEle.innerText = `Doing pre-search work...`

    const literalSearchCount = await getCount(literalSearchEle.value, {})
    const sortForCount = await getCount(sortForEle.value, {})
    const sortAgainstCount = await getCount(sortAgainstEle.value, {})

    if (censusSizeEle.value === "") {
        censusSizeEle.value = `10000`
    }
    const censusSize: number = Number(censusSizeEle.value)


    let censusFor: Census | undefined
    let censusAgainst: Census | undefined
    if (sortForCount < censusSize || alwaysUseCensusCBEle.checked) {
        censusFor = new Census(await getPosts(sortForEle.value, censusSize, {}))
    }
    if (sortAgainstCount < censusSize || alwaysUseCensusCBEle.checked) {
        censusAgainst = new Census(await getPosts(sortAgainstEle.value, censusSize, {}))
    }

    let amtPosts = 1
    while (amtPosts < Math.min(50000, literalSearchCount * 2) && !searchNeedsStopped) {
        statusDisplayEle.innerText = `Redoing search with ${amtPosts} posts...`
        await search(amtPosts, censusFor, censusAgainst)
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

async function rateTag(t: string, promptFor: string, promptAgainst: string, censusFor?: Census, censusAgainst?: Census): Promise<number> {

    let proportionFor: number | undefined = undefined
    if (censusFor) {
        proportionFor = (censusFor.count(t) + 1) / (censusFor.size + 2)
    } else {
        const countOfTInFor = await getCount(`${t} ${promptFor}`, { lookInCache: false, storeInCache: false })
        const countOfFor = await getCount(promptFor, {})//use cache for this
        proportionFor = (countOfTInFor + 1) / (countOfFor + 2)
    }

    let proportionAgainst: number | undefined = undefined
    if (censusAgainst) {
        proportionAgainst = (censusAgainst.count(t) + 1) / (censusAgainst.size + 2)
    } else {
        const countOfTInAgainst = await getCount(`${t} ${promptAgainst}`, { lookInCache: false, storeInCache: false })
        const countOfAgainst = await getCount(promptAgainst, {})//use cache for this
        proportionAgainst = (countOfTInAgainst + 1) / (countOfAgainst + 2)
    }

    const ret = proportionFor / proportionAgainst

    console.log(`just rated the tag ${t} as ${ret}`)

    return ret
}
const rateTagF$ = new AsyncFunctionCache<number, typeof rateTag>(rateTag, 10000, 24)

async function ratePost(p: Post, promptFor: string, promptAgainst: string, censusFor?: Census, censusAgainst?: Census): Promise<number> {
    const ratingPromises: Promise<number>[] = []
    for (const tag of p.tags.values()) {
        ratingPromises.push(rateTagF$.call(tag, promptFor, promptAgainst, censusFor, censusAgainst))
    }

    const ratings: number[] = await Promise.all(ratingPromises)

    let product = 1
    for (const rating of ratings) {
        product *= rating
    }
    return Math.pow(product, 1 / p.tags.size)
}

async function search(amtPosts: number, censusFor?: Census, censusAgainst?: Census) {
    const searchedPosts = await getPosts(literalSearchEle.value, amtPosts, {})
    const promptFor = sortForEle.value
    const promptAgainst = sortAgainstEle.value


    const postRatingPromises: Promise<number>[] = [] //an array in the same order as searchedPosts
    for (const post of searchedPosts) {
        postRatingPromises.push(ratePost(post, promptFor, promptAgainst, censusFor, censusAgainst))
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


