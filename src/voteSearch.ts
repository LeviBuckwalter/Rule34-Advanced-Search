import { smartGetElement } from "./functions.js";
import { getPosts, getProportion, getRelativeProportion } from "../R34-Tools/src/functions/general_functions/end_user.js";
import { getCount } from "../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js";
import { Post } from "../R34-Tools/src/classes/Post";

const passedPosts: Set<number> = new Set() //a set containing the ids of posts which the user has "passed" on
const votedPosts: Map<number, Post> = new Map() //a map of postIds to posts for all the posts that have been voted on
const scores: Map<number, number> = new Map() //a map of postIds to scores
let currentPost: Post //the post currently being displayed and voted on

type protoTuple = string[] //to convert to tuple, alphabetize and JSON.stringify
type tuple = string //an array of tags, alphabetized and then JSON.stringified

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


async function vote(score: number): Promise<void> {
    scores.set(currentPost!.id, score)
    votedPosts.set(currentPost!.id, currentPost!)
    currentPost = await findNewPost()
    resetDisplay()
}

async function findNewPost(): Promise<Post> {
    //make a set of tuples for each post in votedPosts
    //make a set of all tuples present in all votedPosts
    //for each tuple, assign a score by looking at the posts it's present in and the score of said posts
    //factor in statistics somehow, blah blah
    //perform a search including the #1 best tuple
    //-> lots of results? exclude the worst tuple and check again (unfortunately I can't exclude an -or- statement, so maybe just exclude the worst singleton)
    //-> a small enough number of results? Go through each one and score it off of the scores figured out in step 3
    //the highest scoring post becomes the new currentPost

    //alphabetize an array of strings by just running sort on it with no function passed in

    //make a set of tuples for each post in votedPosts
    const tupleSetsWithScore: { tupleSet: Set<tuple>, score: number }[] = [] //an entry for each post, showing what tuples are in the post and what the post's score is
    for (const post of votedPosts.values()) {
        tupleSetsWithScore.push({
            tupleSet: tupleSet(post.tags),
            score: scores.get(post.id)!
        })
    }

    //make a set of all tuples present in all votedPosts
    const allTuples: Set<tuple> = new Set()
    for (const { tupleSet } of tupleSetsWithScore) {
        for (const tuple of tupleSet.values()) {
            allTuples.add(tuple)
        }
    }

    //assign an avgScore for each tuple by looking at the scores of the posts it's found in
    const tuplesWithAvgScore: { tuple: tuple, avgScore: number }[] = []
    for (const tuple of allTuples.values()) {
        let scoreTotal = 0
        let scoreInstances = 0
        for (const { tupleSet, score } of tupleSetsWithScore) {
            if (tupleSet.has(tuple)) {
                scoreTotal += score
                scoreInstances++
            }
        }
        const avgScore = scoreTotal / scoreInstances
        tuplesWithAvgScore.push({ tuple, avgScore })
    }

    tuplesWithAvgScore.sort(function (a, b) {
        return b.avgScore - a.avgScore
    })

    let prompt = ""
    const scope = smartGetElement("scopeInput", HTMLInputElement).value
    for (const { tuple } of tuplesWithAvgScore) {
        prompt = `${scope} ${untuple(tuple).join(" ")}`
        const count = await getCount(prompt, {})
        if (count === 0) {
            //the prompt is bad
            continue
        } else if (count > 200) {
            //assume the prompt is good
            break
        } else {
            const posts = await getPosts(prompt, 1000, {})
            let approve = false
            for (const post of posts) {
                if (!passedPosts.has(post.id) && !votedPosts.has(post.id)) {
                    //the prompt is good
                    approve = true
                    break
                }
            }
            if (approve) { break }
        }
        console.log(`The prompt "${prompt}" has ${count} results. The next prompt will be checked.`)
    }




    // let amtTuplesInPrompt = 1
    // let prompt = ""
    // const scope = smartGetElement("scopeInput", HTMLInputElement).value
    // let loops = 0
    // let looping = true
    // while (looping) {
    //     const tuples = tuplesWithAvgScore.slice(0, amtTuplesInPrompt)

    //     //construct prompt from tuples array
    //     prompt = `${scope} ( `
    //     for (const { tuple } of tuples) {
    //         prompt += untuple(tuple).join(" ") + " ~ "
    //     }
    //     prompt = prompt.slice(0, -2)
    //     prompt += ")"


    //     console.log(`Checking the prompt "${prompt}"...`)
    //     //check the count of prompt
    //     if (await getCount(prompt, {}) > 100) {
    //         looping = false
    //     } else {
    //         amtTuplesInPrompt++
    //     }

    //     //safety feature
    //     loops++
    //     if (loops > 30) {
    //         throw new Error(`while loop in findNewPost got past 30 loops, shouldn't happen`)
    //     }
    // }


    const posts = await getPosts(prompt, 1000, {})
    for (const post of posts) {
        if (!passedPosts.has(post.id) && !votedPosts.has(post.id)) {
            return post
        }
    }
    //if you get to this point:
    throw new Error(`all ${posts.length} posts have already been passed on/voted on`)
}

function resetDisplay(): void {
    if (currentPost) {
        smartGetElement("imageElement", HTMLImageElement).src = currentPost.thumbnailUrl
        smartGetElement("imageLinkElement", HTMLAnchorElement).href = currentPost.siteUrl
    } else {
        console.log("cannot reset the post display because currentPost is undefined")
    }

    const sumDiv = smartGetElement("summaryDiv", HTMLDivElement)
    sumDiv.innerHTML = ""
    for (const post of votedPosts.values()) {
        const score: number = scores.get(post.id)!

        const anchorEle = document.createElement("a")
        anchorEle.href = post.siteUrl
        const imageEle = document.createElement("img")
        imageEle.src = post.thumbnailUrl
        anchorEle.appendChild(imageEle)
        const spanEle = document.createElement("span")
        spanEle.textContent = `Score: ${score}`
        const plusButton = document.createElement("button")
        plusButton.innerText = "+1"
        plusButton.addEventListener("click", function () {
            scores.set(post.id, score + 1)
            resetDisplay()
        })
        const minusButton = document.createElement("button")
        minusButton.innerText = "-1"
        minusButton.addEventListener("click", function () {
            scores.set(post.id, score - 1)
            resetDisplay()
        })
        const xButtonEle = document.createElement("button")
        xButtonEle.textContent = "Remove"
        xButtonEle.addEventListener("click", function () {
            votedPosts.delete(post.id)
            resetDisplay()
        })
        const postDiv = document.createElement("div")
        postDiv.appendChild(anchorEle)
        postDiv.appendChild(spanEle)
        postDiv.appendChild(minusButton)
        postDiv.appendChild(plusButton)
        postDiv.appendChild(xButtonEle)

        sumDiv.appendChild(postDiv)
    }
}

window.onload = async function () {
    await resetAnchor()
    const scope = smartGetElement("scopeInput", HTMLInputElement).value
    currentPost = (await getPosts(scope, 1, {}))[0]
    resetDisplay()
}

smartGetElement("bigYesButton", HTMLButtonElement).addEventListener("click", async function () { await vote(2) })
// smartGetElement("bigYesButton", HTMLButtonElement).addEventListener("click", function () {
//     const tagsSet: Set<string> = new Set()
//     tagsSet.add("why")
//     tagsSet.add("hello")
//     tagsSet.add("you")
//     tagsSet.add("good")
//     tagsSet.add("lookin")
//     tagsSet.add("gal")
//     const tuplesSet = tupleSet(tagsSet)
//     for (const tuple of tuplesSet.values()) {
//         console.log(tuple)
//     }
// })
smartGetElement("littleYesButton", HTMLButtonElement).addEventListener("click", async function () { await vote(1) })
smartGetElement("evenStevenButton", HTMLButtonElement).addEventListener("click", async function () { await vote(0) })
smartGetElement("littleNoButton", HTMLButtonElement).addEventListener("click", async function () { await vote(-1) })
smartGetElement("bigNoButton", HTMLButtonElement).addEventListener("click", async function () { await vote(-2) })

smartGetElement("passButton", HTMLButtonElement).addEventListener("click", async function () {
    passedPosts.add(currentPost!.id)
    currentPost = await findNewPost()
    resetDisplay()
})



