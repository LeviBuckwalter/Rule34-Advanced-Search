import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { PromptCountFC } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { getCommonness, getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
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
    const ttrb = sortForEle.value
    const literalSearchPrompt = literalSearchEle.value
    const comTtrb = getCommonness(ttrb)

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
        const tagRatingIngredients: { amtTtrWithTtrb: Promise<number>, amtTtr: Promise<number> }[] = []
        for (const ttr of post.tags.values()) {
            tagRatingIngredients.push({
                amtTtrWithTtrb: PromptCountFC.call(`${ttr} ${ttrb}`),
                amtTtr: PromptCountFC.call(`${ttr}`)
            })
        }
        //take geometric mean of commonness of ttrb within ttr divided by the overrall commonness of ttrb. That way if a tag is saying "meh ttrb is about as common here as anywhere" it will have little effect on the average.
        let sumOfLogs = 0
        for (const obj of tagRatingIngredients) {
            const comTtrbWithinTtr = (await obj.amtTtrWithTtrb + 1) / (await obj.amtTtr + 1)
            sumOfLogs += Math.log10(comTtrbWithinTtr / await comTtrb)
        }
        const rating = Math.pow(10, sumOfLogs / post.tags.size)

        console.log(`rating of ${rating}: ${post.siteUrl}`)

        return rating
    }
})

const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})



