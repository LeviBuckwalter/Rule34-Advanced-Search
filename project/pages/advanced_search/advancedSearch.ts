import { resetAnchor } from "../../../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { getCount } from "../../../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { PostDisplayArray } from "../../classes/PostDisplayArray.js";
import { Searcher } from "../../classes/Searcher.js";
import { smartGetElement } from "../../functions/generalFunctions.js";



window.onload = async function () {
    await resetAnchor()
}


const maxSubRatePosts = smartGetElement("maxSubRatePosts", HTMLInputElement)
const literalSearchEle = smartGetElement("literalSearch", HTMLInputElement)
const sortForEle = smartGetElement("sortFor", HTMLInputElement)
const statusDisplayEle = smartGetElement("statusDiv", HTMLDivElement)
const searchButtonEle = smartGetElement("searchButton", HTMLButtonElement)
searchButtonEle.addEventListener("click", async function () {
    const searchForPrompt = sortForEle.value

    searcher = new Searcher(
        new SortedSample(await getPosts("", 10000, { storeInCache: false })),
        new Census(await getPosts(searchForPrompt, 1000, { storeInCache: false })),
        searchForPrompt,
        literalSearchEle.value,
        function () {
            pdArray.posts = searcher!.sortedPosts
            pdArray.display()
        }
    )
    if (maxSubRatePosts.value !== "") {
        searcher.postRater.parameters.lvl2RateMaxPosts = Number(maxSubRatePosts.value)
    }

    searcher.go()
})
const stopSearchButtonEle = smartGetElement("stopSearchButton", HTMLButtonElement)
stopSearchButtonEle.addEventListener("click", function () {
    searcher!.stop()
})

const pdArray = new PostDisplayArray([], smartGetElement("postDisplay", HTMLSpanElement), {})
let searcher: Searcher | undefined = undefined



let searchNeedsStopped = false
type ratePost2DataObject = {
    generalSample: SortedSample,
    censusPFor: Census,
    censusPAgainst: Census
}



