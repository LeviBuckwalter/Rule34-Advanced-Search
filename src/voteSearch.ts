import { pow2, smartGetElement } from "./functions.js";
import { getPosts, getProportion, getRelativeProportion } from "../R34-Tools/src/functions/general_functions/end_user.js";
import { getCount } from "../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { Post } from "../R34-Tools/src/classes/Post";

const ratedPosts: Map<number, Post> = new Map() //a map of postIds to posts for all the posts that have been voted on
const ratings: Map<number, number> = new Map() //a map of postIds to scores
let selectedPost: Post | undefined //the post currently being displayed and voted on
let searchedPosts: Post[] | undefined //the posts that have been scored by the search function (not all of these are neccesarily being displayed)
let searchPageNumber = 1
let postsPerPage = 20

type protoTuple = string[] //to convert to tuple, alphabetize and join with " "
type tuple = string //an array of tags, alphabetized and then joined with " "

function tuple(pt: protoTuple): tuple {
    return (pt.sort()).join("+")
}
function untuple(tuple: tuple): protoTuple {
    return tuple.split("+")
}

function tupleSet(tags: Set<string>): Set<tuple> {
    const tagsArray: string[] = []
    for (const tag of tags.values()) {
        tagsArray.push(tag)
    }

    const protoTuples: protoTuple[] = []

    //fill protoTuples:
    //only built for making couples rn
    for (let i = 0; i < tagsArray.length; i++) {
        const tagA = tagsArray[i]
        const viableBTags = tagsArray.slice(i + 1, tagsArray.length)
        for (let j = 0; j < viableBTags.length; j++) {
            const tagB = viableBTags[j]
            const newPT: protoTuple = [tagA, tagB]
            protoTuples.push(newPT)
        }
    }

    const tuples: Set<tuple> = new Set()
    for (const pt of protoTuples) {
        tuples.add(tuple(pt))
    }

    return tuples
}
function tagsInCommon(tagSetA: Set<string>, tagSetB: Set<string>): number {
    let sum = 0
    if (tagSetA.size < tagSetB.size) {
        for (const tag of tagSetA.values()) {
            if (tagSetB.has(tag)) {
                sum++
            }
        }
    } else {
        for (const tag of tagSetB.values()) {
            if (tagSetA.has(tag)) {
                sum++
            }
        }
    }
    return sum
}


async function rate(rating: number): Promise<void> {
    if (selectedPost) {
        if (rating === 0 || !ratings.has(selectedPost.id)) {
            ratings.set(selectedPost.id, rating)
        } else {
            ratings.set(selectedPost.id, ratings.get(selectedPost.id)! + rating)
        }

        ratedPosts.set(selectedPost.id, selectedPost)
        resetDisplay()
    }
}


async function search(): Promise<void> {
    /*
    this function uses the information gathered through votes to replace the current searchedPosts with new posts. It looks at tag commonnesses and constructs a search prompt that will return not too many and not too few posts (hopefully).
    It does not reset the display - that's another function's jurisdiction.
    */

    const scope = smartGetElement("scopeInput", HTMLInputElement).value


    if (ratedPosts.size === 0) {
        searchedPosts = await getPosts(scope, 1000, {})
        return
    }

    //if there are some voted on posts:
    //make a list of all tags in posts that are voted yes
    //for each tag, if there is an instance of the tag that shows up in the posts voted no, take the ratio of good instances to bad instances as the score for that tag
    //if no instance in posts voted no, compare the commonness of the tag in posts voted yes to the commonness of it in all posts, and take that as the score
    //using the tags with scores, assemble a search prompt
    //start with just the #1 tag
    //too few posts? or it with the next tag and try again
    //too many posts? and it with the next tag and try again
    //get ~50 posts from the prompt and fill searchedPosts


    //if there are some voted on posts:
    //1 generate scores for each tag
    //1.1 aggregate all tags present in votedPosts and find the center of mass of its score
    const tags: string[] = [] //an array of all tags found in votedPosts
    const tagsToVotes: Map<string, { totalScore: number, amtSamples: number }> = new Map() //a map of every tag with its vote data
    for (const post of ratedPosts.values()) {
        const vote = ratings.get(post.id)!
        for (const tag of post.tags.values()) {
            tags.push(tag)
            //is there already an entry for this tag?
            if (tagsToVotes.has(tag)) {
                //if so, add this score to the existing scores
                const entry = tagsToVotes.get(tag)!
                entry.totalScore += vote
                entry.amtSamples++
            } else {
                tagsToVotes.set(tag, { totalScore: vote, amtSamples: 1 })
            }
        }
    }

    const tagsWithScore: { tag: string, score: number }[] = []


    //1.2 find totalCount of each tag
    const countAll = getCount("", {})
    const tagsToCounts: Map<string, Promise<number>> = new Map()
    for (const tag of tags) {
        tagsToCounts.set(tag, getCount(tag, {}))
    }

    //1.3 use center of mass and count to make score for each tag
    const tagsToScore: Map<string, number> = new Map()
    for (const tag of tags) {
        const centerOfMass = tagsToVotes.get(tag)!.totalScore / tagsToVotes.get(tag)!.amtSamples
        const commonness = (await tagsToCounts.get(tag)!) / (await countAll)

        const tagScore = centerOfMass * Math.pow(commonness, 0.1)

        console.log(`tag: "${tag}", centerOfMass: ${centerOfMass}, commonness: ${commonness}, score: ${tagScore}`)
    }


    //2 sort tags by score
    tags.sort(function (a, b) {
        return tagsToScore.get(b)! - tagsToScore.get(a)!
    })



    //3 construct prompt from tagsWithScore
    let prompt: string

    const minPostsInput = smartGetElement("minPostsInput", HTMLInputElement)
    const maxPostsInput = smartGetElement("maxPostsInput", HTMLInputElement)

    if (Number(minPostsInput.value) === 0) {
        minPostsInput.value = `${100}`
    }
    if (Number(maxPostsInput.value) < Number(minPostsInput.value)) {
        maxPostsInput.value = `${Number(minPostsInput.value) * 2}`
    }

    const minPosts: number = Number(minPostsInput.value)
    const maxPosts: number = Number(maxPostsInput.value)

    const promptDisplayDiv = smartGetElement("promptDisplayDiv", HTMLDivElement)


    if (await getCount(scope, {}) < minPosts) {
        //3a if the scope is narrow enough already
        console.log(`determined scope was already narrow enough. prompt = "${scope}"`)
        prompt = scope
    } else {
        //3b.1 create workingPrompt and prompt() framework
        /*
        a workingPrompt like this:
        [feet, armpit, [nsfw, green_eyes, french_fries], femboy]
        would translate to this:
        "feet armpit ( nsfw ~ green_eyes ~ french_fries ) femboy"

        so the strings correspond to tags that will be combined via AND, and string arrays are tags that will be combined via OR
        */
        const workingPrompt: Array<string | string[]> = [scope]
        function stringifyWorkingPrompt(): string {
            let p = ""
            for (const term of workingPrompt) {
                if (term instanceof Array) {
                    let termStr = "( " + term[0]
                    for (let i = 1; i < term.length; i++) {
                        termStr += ` ~ ${term[i]}`
                    }
                    termStr += " )"
                    p += termStr + " "
                } else {
                    p += term + " "
                }
            }
            return p
        }

        //3b.2 use workingPrompt framework to create and test different prompts
        /*
        narrow and widen the prompt repeatedly. If it's too narrow, use the next best tag to OR the most recent tag added to the prompt. If the scope is too broad, add the next best tag to the prompt.
        */
        for (const tag of tags.slice(0, 21)) {
            const count = await getCount(stringifyWorkingPrompt(), {})
            promptDisplayDiv.innerText = `Testing the prompt "${stringifyWorkingPrompt()}", which returns ${count} posts...`
            if (count > maxPosts) {
                workingPrompt.push(tag)
            } else if (count < minPosts) {
                const finalElement = workingPrompt[workingPrompt.length - 1]
                if (finalElement instanceof Array) {
                    finalElement.push(tag)
                } else {
                    workingPrompt[workingPrompt.length - 1] = [finalElement, tag]
                }
            }
        }

        prompt = stringifyWorkingPrompt()
    }


    promptDisplayDiv.innerText = `Final prompt: "${prompt}", which returns ${await getCount(prompt, {})} posts.`




    //4 use prompt to generate posts
    let posts = await getPosts(prompt, maxPosts, {})


    //5 remove posts already voted on
    const goodPosts = []
    for (const post of posts) {
        if (!ratedPosts.has(post.id)) {
            goodPosts.push(post)
        }
    }
    posts = goodPosts


    //6 sort posts
    //6.1 generate a score for each post
    const postScores: Map<number, number> = new Map() //mapping postIds to scores
    for (const postToScore of posts) {
        let score = 0
        for (const ratedPost of ratedPosts.values()) {
            const rating = ratings.get(ratedPost.id)!

            const amtCommonTags = tagsInCommon(ratedPost.tags, postToScore.tags)
            const avgAmtTags = (ratedPost.tags.size + postToScore.tags.size) / 2

            score += pow2((amtCommonTags / avgAmtTags) * rating, 2)
        }
        postScores.set(postToScore.id, score)
    }

    //6.2 sort posts by score
    posts.sort(function (a, b) {
        return postScores.get(b.id)! - postScores.get(a.id)!
    })


    //7 set searchedPosts to sorted posts
    searchedPosts = posts
}

function resetDisplay(): void {
    //rating display
    const rateSpan = smartGetElement("rateSpan", HTMLSpanElement)
    if (selectedPost && ratings.has(selectedPost.id)) {
        rateSpan.innerText = `rating: ${ratings.get(selectedPost.id)}`
    } else {
        rateSpan.innerHTML = ""
    }

    //selected post display
    const imageDiv = smartGetElement("currentImageDiv", HTMLDivElement)
    if (selectedPost) {
        imageDiv.innerText = ""

        const anchorEle = document.createElement("a")
        anchorEle.href = selectedPost.siteUrl
        anchorEle.target = "_blank"
        const imageEle = document.createElement("img")
        imageEle.src = selectedPost.mediumImageUrl
        imageEle.style.maxWidth = "80vw"
        imageEle.style.maxHeight = "80vh"
        imageEle.style.width = "auto"
        imageEle.style.height = "auto"
        anchorEle.appendChild(imageEle)

        const tagsDetails = document.createElement("details")
        let tagsStr = ""
        for (const tag of selectedPost.tags.values()) {
            tagsStr += `${tag}, `
        }
        tagsStr = tagsStr.slice(0, tagsStr.length - 2)
        tagsDetails.innerText = tagsStr

        const tagsDetailsSummary = document.createElement("summary")
        tagsDetailsSummary.innerText = "Tags"
        tagsDetails.appendChild(tagsDetailsSummary)

        imageDiv.appendChild(anchorEle)
        imageDiv.appendChild(tagsDetails)
    } else {
        imageDiv.innerHTML = ""
        imageDiv.innerText = `[currently no post is selected]`
    }

    //summary display
    const sumDiv = smartGetElement("summaryDiv", HTMLDivElement)
    sumDiv.innerHTML = ""
    if (ratedPosts.size === 0) {
        sumDiv.innerText = "[there are no rated posts to display]"
    } else {
        for (const post of ratedPosts.values()) {
            const score: number = ratings.get(post.id)!

            const anchorEle = document.createElement("a")
            anchorEle.href = post.siteUrl
            anchorEle.target = "_blank"
            const imgEle = document.createElement("img")
            imgEle.src = post.thumbnailUrl
            anchorEle.appendChild(imgEle)
            const spanEle = document.createElement("span")
            spanEle.textContent = `Score: ${score}`
            const plusButton = document.createElement("button")
            plusButton.innerText = "+1"
            plusButton.addEventListener("click", function () {
                ratings.set(post.id, score + 1)
                resetDisplay()
            })
            const minusButton = document.createElement("button")
            minusButton.innerText = "-1"
            minusButton.addEventListener("click", function () {
                ratings.set(post.id, score - 1)
                resetDisplay()
            })
            const removeButtonEle = document.createElement("button")
            removeButtonEle.textContent = "Remove"
            removeButtonEle.addEventListener("click", function () {
                ratedPosts.delete(post.id)
                ratings.delete(post.id)
                resetDisplay()
            })
            const postDiv = document.createElement("div")
            postDiv.appendChild(anchorEle)
            postDiv.appendChild(spanEle)
            postDiv.appendChild(minusButton)
            postDiv.appendChild(plusButton)
            postDiv.appendChild(removeButtonEle)

            sumDiv.appendChild(postDiv)
        }
    }


    //search display
    const searchPostDisplayDiv = smartGetElement("searchPostDisplay", HTMLDivElement)
    searchPostDisplayDiv.innerHTML = ""
    if (searchedPosts) {
        const pageNumberSpan = smartGetElement("searchPageNumberDisplaySpan", HTMLSpanElement)
        pageNumberSpan.innerText = `page ${searchPageNumber} of ${Math.ceil(searchedPosts.length / postsPerPage)}`
        const postsToDisplay = searchedPosts.slice(postsPerPage * (searchPageNumber - 1), postsPerPage * searchPageNumber)
        for (const post of postsToDisplay) {
            const imgEle = document.createElement("img")
            imgEle.src = post.thumbnailUrl
            imgEle.addEventListener("click", function () {
                selectedPost = post
                resetDisplay()
            })
            searchPostDisplayDiv.appendChild(imgEle)
        }
    } else {
        searchPostDisplayDiv.innerText = `[there are no searched posts]`
    }
}

window.onload = async function () {
    await resetAnchor()
    const scope = smartGetElement("scopeInput", HTMLInputElement).value
    resetDisplay()
}

smartGetElement("ratePlusOne", HTMLButtonElement).addEventListener("click", async function () { await rate(1) })
smartGetElement("rateZero", HTMLButtonElement).addEventListener("click", async function () { await rate(0) })
smartGetElement("rateMinusOne", HTMLButtonElement).addEventListener("click", async function () { await rate(-1) })


smartGetElement("refreshButton", HTMLButtonElement).addEventListener("click", async function () {
    selectedPost = undefined
    searchPageNumber = 1
    await search()
    resetDisplay()
})

smartGetElement("searchPrev", HTMLButtonElement).addEventListener("click", function () {
    if (!searchedPosts) {
        return
    }
    if (searchPageNumber > 1) {
        searchPageNumber--
        resetDisplay()
    }
})

smartGetElement("searchNext", HTMLButtonElement).addEventListener("click", function () {
    if (!searchedPosts) {
        return
    }
    if (searchPageNumber < Math.ceil(searchedPosts.length / postsPerPage)) {
        searchPageNumber++
        resetDisplay()
    }
})