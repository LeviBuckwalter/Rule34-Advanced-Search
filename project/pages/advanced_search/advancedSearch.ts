import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../functions/PostDisplayArray.js";
import { ratePostByPosts } from "../../functions/R34ToolsFunctions.js";
import { smartGetElement } from "../../functions/generalFunctions.js";

const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const sortForEle = smartGetElement("sortFor", HTMLInputElement)
const sortAgainsetEle = smartGetElement("sortAgainst", HTMLInputElement)
const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement)

window.onload = async function () {
    await resetAnchor()
}

searchButtonEle.addEventListener("click", async function () {
    const searchedPosts = getPosts(literalSearchEle.value, 30000, {})
    const postsFor = getPosts(sortForEle.value, 10000, {})
    const postsAgainst = getPosts(sortAgainsetEle.value, 10000, {})

    const censusFor = new Census(await postsFor)
    const censusAgainst = new Census(await postsAgainst)

    // console.log(`searchedPosts: ${(await searchedPosts).length}`)
    // console.log(`postsFor: ${(await postsFor).length}`)
    // console.log(`postsAgainst: ${(await postsAgainst).length}`)

    // const postsToRateBy: { post: Post, score: number }[] = []
    // for (const post of (await postsFor)) {
    //     postsToRateBy.push({
    //         post: post,
    //         score: 1
    //     })
    // }
    // for (const post of (await postsAgainst)) {
    //     postsToRateBy.push({
    //         post: post,
    //         score: -1
    //     })
    // }

    const ratedPosts: { post: Post, rating: number }[] = []
    for (const post of (await searchedPosts)) {
        let rating = 0
        for (const tag of post.tags.values()) {
            rating += (censusFor.count(tag) + 1) / (censusAgainst.count(tag) + 1)
        }

        ratedPosts.push({
            post: post,
            rating: rating
        })
    }

    ratedPosts.sort(function (a, b) {
        return b.rating - a.rating
    })

    const sortedPosts: Post[] = []
    for (const { post } of ratedPosts) {
        sortedPosts.push(post)
    }

    pdArray.posts = sortedPosts
    pdArray.currentPage = 1
    pdArray.display()
})