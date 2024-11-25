import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { PromptCountFC } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { Searcher } from "../../classes/Searcher.js";
import { smartGetElement } from "../../functions/html_functions.js";



window.onload = async function () {
    await resetAnchor()
}


const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const amtPostsEle = smartGetElement("amtPosts", HTMLInputElement)
const sortForEle = smartGetElement("sortFor", HTMLInputElement)
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement)
searchButtonEle.addEventListener("click", async function () {
    const searchForPrompt = sortForEle.value
    const literalSearchPrompt = literalSearchEle.value
    if (amtPostsEle.value === "") {
        amtPostsEle.value = `${100}`
    }
    const amtPostsNum = Number(amtPostsEle.value)

    const postsToRate = await getPosts(literalSearchPrompt, amtPostsNum, {})
    const postRatingPromisesById: Map<number, Promise<number>> = new Map()
    for (const post of postsToRate) {
        postRatingPromisesById.set(post.id, ratePost(post))
    }
    const postRatingsById: Map<number, number> = new Map()
    for (const post of postsToRate) {
        postRatingsById.set(post.id, await postRatingPromisesById.get(post.id)!)
    }
    postsToRate.sort(function (a, b) {
        return postRatingsById.get(b.id)! - postRatingsById.get(a.id)!
    })

    pdArray.posts = postsToRate
    pdArray.display()

    async function ratePost(post: Post): Promise<number> {
        const tagRatingIngredients: { amtPostsWith: Promise<number>, amtPostsTotal: Promise<number> }[] = []
        for (const tag of post.tags.values()) {
            tagRatingIngredients.push({
                amtPostsWith: PromptCountFC.call(`${tag} ${searchForPrompt}`),
                amtPostsTotal: PromptCountFC.call(`${tag}`)
            })
        }
        let sumOfLogs = 0
        for (const obj of tagRatingIngredients) {
            const amtPostsWithout = await obj.amtPostsTotal - await obj.amtPostsWith
            sumOfLogs += Math.log10((amtPostsWithout + 1) / (await obj.amtPostsWith + 1))
        }
        const product = Math.pow(10, sumOfLogs)

        console.log(`rating of ${1 / (1 + product)}: ${post.siteUrl}`)

        return 1 / (1 + product)
    }
})

const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})



