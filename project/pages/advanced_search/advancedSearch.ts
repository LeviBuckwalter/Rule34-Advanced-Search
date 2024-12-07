import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { PromptCountFC } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { getCommonness, getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { roundTo } from "../../functions/general_functions.js";
import { smartGetElement } from "../../functions/html_functions.js";



window.onload = async function () {
    await resetAnchor()
}

const exhaustedTags: Set<string> = new Set()
let topTagsList: { tag: string, rating: number }[] = []
const topTagsSet: Set<string> = new Set()
const maxTopTags: number = 100
let searching: boolean = false


const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const litSearchCountDispEle = smartGetElement("litSearchCountDisp", HTMLSpanElement)
const sortForEle = smartGetElement("sortFor", HTMLInputElement)
const sortForCountDispEle = smartGetElement("sortForCountDisp", HTMLSpanElement)
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement)
const stopSearchButtonEle = smartGetElement("stopSearchButton", HTMLButtonElement)
const searchTextDispEle = smartGetElement("searchTextDisp", HTMLSpanElement)
stopSearchButtonEle.addEventListener("click", function () { searching = false })
searchButtonEle.addEventListener("click", async function () {
    exhaustedTags.clear()
    topTagsList = []
    topTagsSet.clear()


    const literalSearchPrompt = literalSearchEle.value
    litSearchCountDispEle.textContent = `${await PromptCountFC.call(literalSearchPrompt)}`
    const ttrb = sortForEle.value
    sortForCountDispEle.textContent = `${await PromptCountFC.call(ttrb)}`
    const comTtrb = getCommonness(ttrb)
    const ratedPostsById: Map<number, Post> = new Map()
    const ratingsById: Map<number, number> = new Map()
    const ratedPostsOrdered: Post[] = []

    searching = true
    while (searching) {
        let tagCurrentlySearching: string | null = null
        if (topTagsList.length > 0) {
            searchTextDispEle.textContent = `Searching "${topTagsList[0].tag}" (rating: ${roundTo(topTagsList[0].rating, 2)})`
            console.log(topTagsList[0].tag, topTagsList[0].rating)
            tagCurrentlySearching = topTagsList[0].tag
        }

        const searchPrompt = `${literalSearchPrompt} ${(tagCurrentlySearching) ? tagCurrentlySearching : ""}`
        const postsToRate = await getPosts(searchPrompt, 1000, {})
        const postRatingPromises: { post: Post, ratingPromise: Promise<number> }[] = []
        for (const post of postsToRate) {
            if (ratedPostsById.has(post.id)) { continue }
            postRatingPromises.push({
                post: post,
                ratingPromise: ratePost(post, ttrb, await comTtrb)
            })
            if (postRatingPromises.length >= 10) {
                break
            }
        }
        if (postRatingPromises.length < 10) {
            if (!tagCurrentlySearching) {
                console.log("reached end of literal search")
                searching = false
            } else {
                exhaustedTags.add(tagCurrentlySearching)
                topTagsList.splice(0, 1)
            }
        }
        for (const { post, ratingPromise } of postRatingPromises) {
            ratedPostsById.set(post.id, post)
            ratingsById.set(post.id, await ratingPromise)
            ratedPostsOrdered.push(post)
        }
        ratedPostsOrdered.sort(function (a, b) {
            return ratingsById.get(b.id)! - ratingsById.get(a.id)!
        })
        pdArray.posts = ratedPostsOrdered
        pdArray.display()
    }


    // const postRatingPromisesById: Map<number, Promise<number>> = new Map()
    // for (const post of postsToRate) {
    //     postRatingPromisesById.set(post.id, ratePost(post, ttrb, await comTtrb))
    // }
    // const postRatingsById: Map<number, number> = new Map()
    // for (const post of postsToRate) {
    //     postRatingsById.set(post.id, await postRatingPromisesById.get(post.id)!)
    // }
    // postsToRate.sort(function (a, b) {
    //     return postRatingsById.get(b.id)! - postRatingsById.get(a.id)!
    // })

    // pdArray.posts = postsToRate
    // pdArray.display()
})

// searchButtonEle.addEventListener("click", async function () {
//     const ttrb = sortForEle.value
//     const literalSearchPrompt = literalSearchEle.value
//     const comTtrb = getCommonness(ttrb)

//     if (amtPostsEle.value === "") {
//         amtPostsEle.value = `${100}`
//     }
//     const amtPostsNum = Number(amtPostsEle.value)

//     const postsToRate = await getPosts(literalSearchPrompt, amtPostsNum, {})
//     const postRatingPromisesById: Map<number, Promise<number>> = new Map()
//     for (const post of postsToRate) {
//         postRatingPromisesById.set(post.id, ratePost(post, ttrb, await comTtrb))
//     }
//     const postRatingsById: Map<number, number> = new Map()
//     for (const post of postsToRate) {
//         postRatingsById.set(post.id, await postRatingPromisesById.get(post.id)!)
//     }
//     postsToRate.sort(function (a, b) {
//         return postRatingsById.get(b.id)! - postRatingsById.get(a.id)!
//     })

//     pdArray.posts = postsToRate
//     pdArray.display()
// })

const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})



async function rateTag(ttr: string, ttrb: string, comTtrb: number): Promise<number> {
    //returns the implied probability of ttrb given ttr. NOT RELATIVE TO COMTTRB

    const amtTtrWithTtrb = PromptCountFC.call(`${ttr} ${ttrb}`)
    const amtTtr = PromptCountFC.call(`${ttr}`)

    const prob = (await amtTtrWithTtrb + 1) / (await amtTtr + 2)
    const rating = prob / comTtrb

    //add ttr to top tags
    if (ttr !== ttrb && !topTagsSet.has(ttr) && await amtTtrWithTtrb > 0 && (topTagsList.length < maxTopTags || rating > topTagsList[topTagsList.length - 1].rating)) {
        topTagsSet.add(ttr)
        topTagsList.push({
            tag: ttr,
            rating: rating
        })
        topTagsList.sort(function (a, b) {
            return b.rating - a.rating
        })
        topTagsList = topTagsList.slice(0, maxTopTags)
    }

    return rating
}

async function ratePost(postToRate: Post, ttrb: string, comTtrb: number): Promise<number> {
    const tagRatingPromises: Promise<number>[] = []
    for (const tag of postToRate.tags.values()) {
        tagRatingPromises.push(rateTag(tag, ttrb, comTtrb))
    }

    const tagRatings = await Promise.all(tagRatingPromises)

    let sumOfLogs = 0
    for (const rating of tagRatings) {
        sumOfLogs += Math.log10(rating)
    }
    const avgLogs = sumOfLogs / postToRate.tags.size

    return avgLogs
}









