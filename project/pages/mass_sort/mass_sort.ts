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
    postDisplay: HTMLSpanElement
})


window.onload = async function () {
    await resetAnchor()
}

htmlEles.initButton.addEventListener("click", async function () {
    const literalSearch = htmlEles.literalSearch.value
    const ttrb = htmlEles.tagToRateBy.value
    const ttrbCount = PromptCountFC.call(ttrb)
    const posts = await getPosts(literalSearch, 10000, { lookInCache: false, storeInCache: false })
    poolSortedSample = new SortedSample(posts)
    for (const post of posts) {
        poolPostIdArray.push(post.id)
        poolPostRatings.set(post.id, 0)
    }

    if (await ttrbCount < 10000) {
        ttrbCensus = new Census(await getPosts(ttrb, 10000, {}))
    }

    console.log("init finished")
})

htmlEles.goButton.addEventListener("click", async function () {
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
})

let poolSortedSample: undefined | SortedSample = undefined
const poolPostRatings: Map<number, number> = new Map() //maps post id to rating
const poolPostIdArray: number[] = []
const l2RatingBank: Map<string, number> = new Map()
let ttrbCensus: Census | undefined = undefined
const postDisplayArray = new PostDisplayArray([], htmlEles.postDisplay, {})


function sortPool() {
    poolPostIdArray.sort(function (a, b) {
        return poolPostRatings.get(b)! - poolPostRatings.get(a)!
    })
}

async function rateNextTag(ttrb: string): Promise<{ tag: string, rating: number }> {
    if (!poolSortedSample) { throw new Error("pool has to be initialized") }
    //find next best tag
    const topTags = poolSortedSample.topTags(l2RatingBank.size + 1)
    const tagToRate: string = topTags[topTags.length - 1].tag
    if (l2RatingBank.has(tagToRate)) { throw new Error("the rating bank already has this tag") }
    const rating = await rateTagL2(tagToRate, ttrb, 100)
    return {
        tag: tagToRate,
        rating: rating
    }
}


async function rateTagL1(ttr: string, ttrb: string) {
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
    const rand = false//(Math.random() > 0.99) ? true : false


    const tagRatingPromises: Promise<number>[] = []
    for (const tag of postToRate.tags.values()) {
        if (rand) { console.log(tag) }
        tagRatingPromises.push(rateTagL1(tag, ttrb))
    }
    const tagRatings: number[] = await Promise.all(tagRatingPromises)
    const comTtrb = await getCommonness(ttrb)
    let sumOfLogs = 0
    for (const tagRating of tagRatings) {
        const relativeProb = tagRating / comTtrb
        if (rand) { console.log(relativeProb) }
        sumOfLogs += Math.log10(relativeProb)
    }
    const avgLogRating = sumOfLogs / tagRatings.length
    return avgLogRating
}

async function rateTagL2(ttr: string, ttrb: string, amtSample: number) {
    const sample = await getPosts(ttr, amtSample, {})
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