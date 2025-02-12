import { getCommonness, getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { PromptCountFC } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { instantiateElements } from "../../functions/html_functions.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";



const htmlEles = instantiateElements({
    literalSearch: HTMLInputElement,
    tagToRateBy: HTMLInputElement,
    initButton: HTMLButtonElement,
    goButton: HTMLButtonElement,
    postDisplay: HTMLSpanElement,
    pendingStepsDisplay: HTMLSpanElement,
    amtStepsInput: HTMLInputElement,
    modeSelect: HTMLSelectElement,
    poolSizeInput: HTMLInputElement,
    initStatusDisplay: HTMLSpanElement
})


// window.onload = async function () {
//     await resetAnchor()
// }

htmlEles.initButton.addEventListener("click", async function () {
    htmlEles.initStatusDisplay.textContent = "Initializing..."

    const poolSize = (htmlEles.poolSizeInput.value !== "") ? Number(htmlEles.poolSizeInput.value) : 10000
    const literalSearch = htmlEles.literalSearch.value
    const ttrb = htmlEles.tagToRateBy.value
    const ttrbCount = PromptCountFC.call(ttrb)
    const posts = await getPosts(literalSearch, poolSize, { lookInCache: false, storeInCache: false })
    poolSortedSample = new SortedSample(posts)
    for (const post of posts) {
        poolPostIdArray.push(post.id)
        poolPostRatings.set(post.id, 0)
    }

    if (await ttrbCount < 10000) {
        ttrbCensus = new Census(await getPosts(ttrb, 10000, { lookInCache: false, storeInCache: false }))
    }

    htmlEles.initStatusDisplay.textContent = "Initialization finished"
})

htmlEles.goButton.addEventListener("click", async function () {
    const amtSteps = (htmlEles.amtStepsInput.value !== "") ? Number(htmlEles.amtStepsInput.value) : 1
    pendingRatings += amtSteps
    htmlEles.pendingStepsDisplay.textContent = `${pendingRatings}`
    if (!stepping) {
        stepping = true
        while (pendingRatings > 0) {
            await step()
            pendingRatings--
            htmlEles.pendingStepsDisplay.textContent = `${pendingRatings}`
        }
        stepping = false
    }
})

let poolSortedSample: undefined | SortedSample = undefined
const poolPostRatings: Map<number, number> = new Map() //maps post id to rating
const poolPostIdArray: number[] = []
const l2RatingBank: Map<string, number> = new Map()
let ttrbCensus: Census | undefined = undefined
const postDisplayArray = new PostDisplayArray([], htmlEles.postDisplay, {})
let pendingRatings = 0
let stepping = false


function sortPool() {
    poolPostIdArray.sort(function (a, b) {
        return poolPostRatings.get(b)! - poolPostRatings.get(a)!
    })
}

async function step() {
    const ttrb = htmlEles.tagToRateBy.value

    if (!poolSortedSample) { throw new Error("the pool needs to be initiated") }
    const { tag: newTag, rating: newTagRating } = await rateNextTag(ttrb)
    l2RatingBank.set(newTag, newTagRating)
    //update ratings on posts in pool that have newTag
    for (const post of poolSortedSample.fetchPosts(newTag)) {
        const newRating = ratePostL2FromBanked(post, l2RatingBank)
        poolPostRatings.set(post.id, newRating)
    }
    sortPool()
    //display pool
    const sortedPosts: Post[] = []
    for (const id of poolPostIdArray) {
        sortedPosts.push(poolSortedSample.postById(id)!)
    }
    postDisplayArray.posts = sortedPosts
    postDisplayArray.display()


    // let topPostsStr = ""
    // for (let i = 0; i < 20; i++) {
    //     const postId = poolPostIdArray[i]
    //     const postRating = poolPostRatings.get(postId)
    //     const post = poolSortedSample.postById(postId)!
    //     topPostsStr += `${post.siteUrl}, rating: ${postRating}\n`
    // }
    // console.log(topPostsStr)
    // console.log(`newTag: ${newTag}, rating: ${newTagRating}`)
}

async function rateNextTag(ttrb: string): Promise<{ tag: string, rating: number }> {
    if (!poolSortedSample) { throw new Error("pool has to be initialized") }
    //find next best tag
    const topTags = poolSortedSample.topTags(l2RatingBank.size + 1)
    const tagToRate: string = topTags[topTags.length - 1].tag
    if (l2RatingBank.has(tagToRate)) { throw new Error("the rating bank already has this tag") }
    if (htmlEles.modeSelect.value === "l1") {
        const probTtrbGivenTtr = await rateTagL1(tagToRate, ttrb)
        const probTtrb = await getCommonness(ttrb)
        const rating = (probTtrbGivenTtr === undefined) ? 0 : Math.log10(probTtrbGivenTtr / probTtrb)
        console.log(`"${tagToRate}": ${rating}`)
        return {
            tag: tagToRate,
            rating: rating
        }
    } else if (htmlEles.modeSelect.value === "l2") {
        const rating = await rateTagL2(tagToRate, ttrb, 100)
        console.log(`"${tagToRate}": ${rating}`)
        return {
            tag: tagToRate,
            rating: rating
        }
    } else {
        throw new Error("Mode is not l1 or l2")
    }
}


async function rateTagL1(ttr: string, ttrb: string): Promise<number | undefined> {
    if (`${ttr}` === `${ttrb}`) {
        return undefined
    }
    let amtPostsTtrTtrb: Promise<number> | number | undefined = undefined
    if (ttrbCensus) {
        amtPostsTtrTtrb = ttrbCensus.count(ttr)
    } else {
        amtPostsTtrTtrb = PromptCountFC.call(`${ttr} ${ttrb}`)
    }

    const amtPostsTtr = PromptCountFC.call(ttr)
    const pTtrbGivenTtr = (await amtPostsTtrTtrb + 1) / (await amtPostsTtr + 2)
    // if (Math.random() > 0.99) { console.log(ttr, pTtrbGivenTtr) }
    return pTtrbGivenTtr
}

async function ratePostL1(postToRate: Post, ttrb: string) {
    const tagRatingPromises: Promise<number | undefined>[] = []
    for (const tag of postToRate.tags.values()) {
        tagRatingPromises.push(rateTagL1(tag, ttrb))
    }
    const tagRatings: Array<number | undefined> = await Promise.all(tagRatingPromises)
    const comTtrb = await getCommonness(ttrb)
    let sumOfLogs = 0
    for (const tagRating of tagRatings) {
        if (tagRating === undefined) {
            //meaning ttr === ttrb
            sumOfLogs += 0
        } else {
            const relativeProb = tagRating / comTtrb
            sumOfLogs += Math.log10(relativeProb)
        }
    }
    const avgLogRating = sumOfLogs / tagRatings.length
    return avgLogRating
}

async function rateTagL2(ttr: string, ttrb: string, amtSample: number) {
    const sample = await getPosts(ttr, amtSample, { lookInCache: false, storeInCache: false })
    const postRatingPromises: Promise<number>[] = []
    for (const post of sample) {
        postRatingPromises.push(ratePostL1(post, ttrb))
    }
    const postRatings: number[] = await Promise.all(postRatingPromises)
    let sum = 0
    for (const rating of postRatings) {
        sum += rating
    }
    const avgRating = sum / postRatings.length
    return avgRating
}

function ratePostL2FromBanked(postToRate: Post, l2RatingBank: Map<string, number>) {
    const ratings: number[] = []
    for (const tag of postToRate.tags.values()) {
        if (l2RatingBank.has(tag)) {
            ratings.push(l2RatingBank.get(tag)!)
        }
    }
    let sum = 0
    for (const rating of ratings) {
        sum += rating
    }
    const avgRating = sum / ratings.length
    return avgRating
}