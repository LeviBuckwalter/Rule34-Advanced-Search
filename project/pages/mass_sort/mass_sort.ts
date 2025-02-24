import { getCommonness, getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { PromptCountFC } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
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
    initStatusDisplay: HTMLSpanElement,
    bufferSelect: HTMLSelectElement
})


//INITIALIZATION
htmlEles.initButton.addEventListener("click", async function () {
    htmlEles.initStatusDisplay.textContent = "Initializing..."

    //initialize poolSortedSample
    const poolSize = (htmlEles.poolSizeInput.value !== "") ? Number(htmlEles.poolSizeInput.value) : 10000
    const literalSearch = htmlEles.literalSearch.value
    const ttrb = htmlEles.tagToRateBy.value
    const ttrbCount = PromptCountFC.call(ttrb)
    const posts = await getPosts(literalSearch, poolSize, { lookInCache: false, storeInCache: false })
    poolSortedSample = new SortedSample(posts)

    //initialize poolPostIdArray and poolPostRatings
    for (const post of posts) {
        poolPostIdArray.push(post.id)
        poolPostRatings.set(post.id, 0)
    }

    //initialize ttrbCensus
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

let poolSortedSample: undefined | SortedSample
const poolPostRatings: Map<number, number> = new Map() //maps post id to rating
const poolPostIdArray: number[] = []
const l2RatingBank: Map<string, number> = new Map()
let ttrbCensus: Census | undefined
const postDisplayArray = new PostDisplayArray([], htmlEles.postDisplay)
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
        const rating = await rateTagL1(tagToRate, ttrb)
        console.log(`"${tagToRate}": ${rating}`)
        return {
            tag: tagToRate,
            rating: (rating) ? rating : 0//in case rating is undefined, meaning ttr === ttrb
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
    //outputs log of relative prob

    if (`${ttr}` === `${ttrb}`) {
        return undefined
    }

    const amtTtrb: Promise<number> = PromptCountFC.call(ttrb)
    const amtAll: Promise<number> = PromptCountFC.call("")
    const amtTtr: Promise<number> = PromptCountFC.call(ttr)
    let amtTtrTtrb: number | Promise<number> | undefined
    if (ttrbCensus) {
        amtTtrTtrb = ttrbCensus.count(ttr)//assumes a complete census of ttrb
    } else {
        amtTtrTtrb = PromptCountFC.call(`${ttr} ${ttrb}`)
    }

    let bufferType: string | undefined
    if (htmlEles.bufferSelect.value === "plusOne") {
        bufferType = "plusOne"
    } else if (htmlEles.bufferSelect.value === "relative") {
        bufferType = "relative"
    } else {
        throw new Error("buffer type is neither plusOne nor relative")
    }


    const bufferedProbTtrbGivenTtr = (await amtTtrTtrb + ((bufferType === "plusOne") ? 1 : await amtTtrb)) / (await amtTtr + ((bufferType === "plusOne") ? 2 : await amtAll))
    const comTtrb = await amtTtrb / await amtAll
    const relProb = bufferedProbTtrbGivenTtr / comTtrb
    const logRelProb = Math.log10(relProb)
    // console.log(`bufferedProbTtrbGivenTtr: ${bufferedProbTtrbGivenTtr}`)
    // console.log(`comTtrb: ${comTtrb}`)
    // console.log(`relProb: ${relProb}`)
    // console.log(`logRelProb: ${logRelProb}`)

    return logRelProb
}

async function ratePostL1(postToRate: Post, ttrb: string) {
    const tagRatingPromises: Promise<number | undefined>[] = []
    for (const tag of postToRate.tags.values()) {
        tagRatingPromises.push(rateTagL1(tag, ttrb))
    }
    const tagRatings: Array<number | undefined> = await Promise.all(tagRatingPromises)
    let sumOfLogs = 0
    for (const tagRating of tagRatings) {
        if (tagRating === undefined) {
            //meaning ttr === ttrb
            sumOfLogs += 0
        } else {
            sumOfLogs += tagRating
        }
    }
    const avgLogRating = sumOfLogs / tagRatings.length
    return avgLogRating
}

async function rateTagL2(ttr: string, ttrb: string, amtSample: number) {
    if (!poolSortedSample) { throw new Error("rateTagL2 was called before initialization") }

    //const sample = await getPosts(ttr, amtSample, { lookInCache: false, storeInCache: false })
    let sample: Post[] | undefined
    const ttrFromPool = poolSortedSample.fetchPosts(ttr)
    if (ttrFromPool.length > 100) {
        sample = ttrFromPool.slice(0, 100)
    } else if (ttrFromPool.length < 50) {
        sample = await getPosts(ttr, 100, { lookInCache: false, storeInCache: false })
    } else /*ttrFromPool.length between 50 and 100*/ {
        sample = ttrFromPool
    }


    const postRatingPromises: Promise<number>[] = []
    for (const post of sample) {
        postRatingPromises.push(ratePostL1(post, ttrb))
    }
    const postRatings: number[] = await Promise.all(postRatingPromises)
    let sum = 0
    for (const rating of postRatings) {
        sum += rating
        // console.log(rating)
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