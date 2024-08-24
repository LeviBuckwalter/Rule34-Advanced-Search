import { smartGetElement } from "./functions.js";
import { getPosts, getProportion, getRelativeProportion } from "../R34-Tools/src/functions/general_functions/end_user.js";
import { getCount } from "../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { Post } from "../R34-Tools/src/classes/Post";

const votedPosts: Map<number, Post> = new Map() //a map of postIds to posts for all the posts that have been voted on
const votes: Map<number, number> = new Map() //a map of postIds to scores
let selectedPost: Post | undefined //the post currently being displayed and voted on
let searchedPosts: Post[] | undefined //the posts that are being displayed in the search area


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


async function vote(score: number): Promise<void> {
    if (selectedPost) {
        votes.set(selectedPost.id, score)
        votedPosts.set(selectedPost.id, selectedPost)
        selectedPost = undefined
        await search()
        resetDisplay()
    }
}


async function search(): Promise<void> {
    /*
    this function uses the information gathered through votes to replace the current searchedPosts with new posts. It looks at tag commonnesses and constructs a search prompt that will return not too many and not too few posts (hopefully).
    It does not reset the display - that's another function's jurisdiction.
    */

    const scope = smartGetElement("scopeInput", HTMLInputElement).value


    if (votedPosts.size === 0) {
        searchedPosts = await getPosts(scope, 100, {})
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
    //1.1 aggregate all tags present in votedPosts and take note of the votes of the posts they're found in
    type arrayOfVotes = number[]
    const tagsToVotes: Map<string, arrayOfVotes> = new Map() //mapping tags to arrays of the scores of the posts they're found in
    let totalVotesYes = 0 //also figure out how many total votes yes and no there are
    let totalVotesNo = 0
    for (const post of votedPosts.values()) {
        const vote = votes.get(post.id)!
        for (const tag of post.tags.values()) {
            //is there already an entry for this tag?
            if (tagsToVotes.has(tag)) {
                //if so, add this score to the existing scores
                tagsToVotes.get(tag)!.push(vote)
            } else {
                tagsToVotes.set(tag, [vote])
            }
        }

        if (vote > 0) {
            totalVotesYes += vote
        } else if (vote < 0) {
            totalVotesNo += Math.abs(vote)
        }
    }

    const tagsWithScore: { tag: string, score: number }[] = []


    //1.2 find which tags will need to be scored asynchronously and which will not
    const tagsWithoutVotesAgainst: string[] = [] //need asynchronous
    const tagsWithVotesForAndAgainst: string[] = []
    for (const entry of tagsToVotes) {
        const tag = entry[0]
        const votes = entry[1]

        if (votes.every(vote => vote >= 0)) {
            tagsWithoutVotesAgainst.push(tag)
        } else {
            tagsWithVotesForAndAgainst.push(tag)
        }
    }


    //1.3 calculate scores for asynchronous tags
    //1.3.1 initiate array of promises
    const countAll = getCount("", {})
    const tagsToCounts: Map<string, Promise<number>> = new Map()
    for (const tag of tagsWithoutVotesAgainst) {
        tagsToCounts.set(tag, getCount(tag, {}))
    }

    //1.3.2 use array of promises to calculate scores
    for (let i = 0; i < tagsWithoutVotesAgainst.length; i++) {
        const tag = tagsWithoutVotesAgainst[i]
        const tagCount = await tagsToCounts.get(tag)!
        const votes = tagsToVotes.get(tag)!

        let tagTotalVotesYes = 0
        for (const vote of votes) {
            tagTotalVotesYes += vote
        }
        const commonnessAmongYes = tagTotalVotesYes / totalVotesYes

        const tagAbsoluteCommonness = tagCount / (await countAll)

        tagsWithScore.push({
            tag: tag,
            score: commonnessAmongYes / tagAbsoluteCommonness
        })
    }


    //1.4 calculate scores for synchronous tags
    for (const tag of tagsWithVotesForAndAgainst) {
        const votes = tagsToVotes.get(tag)!

        let tagTotalVotesYes = 0
        let tagTotalVotesNo = 0
        for (const vote of votes) {
            if (vote > 0) {
                tagTotalVotesYes += vote
            } else if (vote < 0) {
                tagTotalVotesNo += Math.abs(vote)
            }
        }

        const commonnessAmongYes = tagTotalVotesYes / totalVotesYes
        const commonnessAmongNo = tagTotalVotesNo / totalVotesNo

        tagsWithScore.push({
            tag: tag,
            score: commonnessAmongYes / commonnessAmongNo
        })
    }


    //2 sort tags by score
    tagsWithScore.sort(function (a, b) {
        return b.score - a.score
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
        for (const { tag } of tagsWithScore.slice(0, 21)) {
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
        if (!votedPosts.has(post.id)) {
            goodPosts.push(post)
        }
    }
    posts = goodPosts


    //6 sort posts
    //6.1 generate a score for each post
    const postScores: Map<number, number> = new Map() //mapping postIds to scores
    for (const postToRate of posts) {
        let score = 0
        for (const votedPost of votedPosts.values()) {
            const vote = votes.get(votedPost.id)!

            const amtCommonTags = tagsInCommon(votedPost.tags, postToRate.tags)
            const avgAmtTags = (votedPost.tags.size + postToRate.tags.size) / 2

            score += Math.pow((amtCommonTags / avgAmtTags) * vote, 2)
        }
        postScores.set(postToRate.id, score)
    }

    //6.2 sort posts by score
    posts.sort(function (a, b) {
        return postScores.get(b.id)! - postScores.get(a.id)!
    })


    //7 set searchedPosts to sorted posts
    searchedPosts = posts.slice(0, Math.min(posts.length, 100))
}

function resetDisplay(): void {
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

        const tagsDiv = document.createElement("div")
        let tagsStr = ""
        for (const tag of selectedPost.tags.values()) {
            tagsStr += `${tag}, `
        }
        tagsDiv.innerText = tagsStr

        imageDiv.appendChild(anchorEle)
        imageDiv.appendChild(tagsDiv)
    } else {
        imageDiv.innerHTML = ""
        imageDiv.innerText = `[currently no post is selected]`
    }

    //search display
    const searchPostDisplayDiv = smartGetElement("searchPostDisplay", HTMLDivElement)
    searchPostDisplayDiv.innerHTML = ""
    if (searchedPosts) {
        for (const post of searchedPosts) {
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

    //summary display
    const sumDiv = smartGetElement("summaryDiv", HTMLDivElement)
    sumDiv.innerHTML = ""
    for (const post of votedPosts.values()) {
        const score: number = votes.get(post.id)!

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
            votes.set(post.id, score + 1)
            resetDisplay()
        })
        const minusButton = document.createElement("button")
        minusButton.innerText = "-1"
        minusButton.addEventListener("click", function () {
            votes.set(post.id, score - 1)
            resetDisplay()
        })
        const removeButtonEle = document.createElement("button")
        removeButtonEle.textContent = "Remove"
        removeButtonEle.addEventListener("click", function () {
            votedPosts.delete(post.id)
            votes.delete(post.id)
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

window.onload = async function () {
    await resetAnchor()
    const scope = smartGetElement("scopeInput", HTMLInputElement).value
    resetDisplay()
}

smartGetElement("voteYesButton", HTMLButtonElement).addEventListener("click", async function () { await vote(1) })
smartGetElement("voteNoButton", HTMLButtonElement).addEventListener("click", async function () { await vote(-1) })

smartGetElement("addPostButton", HTMLButtonElement).addEventListener("click", async function () {
    const id = Number(smartGetElement("addPostIdInput", HTMLInputElement).value)
    const post = (await getPosts(`id:${id}`, 1, { lookInCache: false, storeInCache: false }))[0]
    selectedPost = post
    resetDisplay()
})
smartGetElement("refreshButton", HTMLButtonElement).addEventListener("click", async function () {
    await search()
    resetDisplay()
})

