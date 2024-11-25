import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { l2TagRater } from "../../classes/L2TagRater.js";
import { l2TagRaterV2 } from "../../classes/L2TagRaterV2.js";
import { smartEl, smartGetElement, toHtml } from "../../functions/html_functions.js";

const ttrbEle = smartGetElement("ttrb", HTMLInputElement)
const createRaterEle = smartGetElement("createRater", HTMLButtonElement)
const checkInitEle = smartGetElement("checkInit", HTMLButtonElement)
const initStatusEle = smartGetElement("initStatus", HTMLDivElement)
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const batchSizeEle = smartGetElement("batchSize", HTMLInputElement)
const fetchBatchEle = smartGetElement("fetchBatch", HTMLButtonElement)
const searchResultsEle = smartGetElement("searchResults", HTMLSpanElement)

let tagRater: undefined | l2TagRaterV2
const idsOfRatedPosts: Set<number> = new Set()
const idToRating: Map<number, number> = new Map()
const idToPost: Map<number, Post> = new Map()

//create rater button
createRaterEle.addEventListener("click", async function () {
    tagRater = new l2TagRaterV2(ttrbEle.value)
    tagRater.init()
})
//check rater initialization button
checkInitEle.addEventListener("click", function () {
    initStatusEle.replaceChildren()
    initStatusEle.appendChild(toHtml(smartEl("div", {}, [`${JSON.stringify(tagRater)}`])))
})
//fetch batch button
fetchBatchEle.addEventListener("click", async function () {
    if (!tagRater || !tagRater.initialized) {
        console.log("tag rater is not ready")
        return
    }
    if (batchSizeEle.value === "") {
        batchSizeEle.value = `${100}`
    }
    const batchSize = Number(batchSizeEle.value)
    const literalSearch = literalSearchEle.value

    //1 fetch new batch
    let batch: Post[] = await getPosts(literalSearch, batchSize, {})

    //2 rate new batch
    const newPostIdToRatingPromise: Map<number, Promise<number>> = new Map()
    // const tags = []
    // for (const tag of batch[0].tags.values()) {
    //     tags.push(tag)
    // }
    // console.log(await tagRater.rate(tags[0]))
    for (const post of batch) {
        newPostIdToRatingPromise.set(post.id, tagRater.ratePost(post))
        console.log(`just initiated rating of post: ${post.siteUrl}`)
    }
    for (const post of batch) {
        const rating = await newPostIdToRatingPromise.get(post.id)!
        idToRating.set(post.id, rating)
        idsOfRatedPosts.add(post.id)
        idToPost.set(post.id, post)

        console.log(post.siteUrl)
        console.log(rating)
    }

    //3 reset display
})

window.onload = async function () {
    await resetAnchor()
}