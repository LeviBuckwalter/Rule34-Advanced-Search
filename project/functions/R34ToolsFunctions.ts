import { Post } from "../../R34-Tools/src/classes/Post.js";
import { pow2 } from "./generalFunctions.js";

export function ratePostByPosts(postToRate: Post, postsToRateBy: { post: Post, score: number }[]): number {
    //You are given a bunch of posts and told where they fall on a linear scale. Based on that, where would you expect this new post to fall?
    //similarity: how similar two posts are to each other.
    //score: a number given to a post by the user indicating how good the post is.
    //happiness: a number associated with a hypothetical score for postToRate, indicating how consistent the score is with the similarites and scores of the postsToRateBy. "How good is this hypothetical score as an answer"

    if (postsToRateBy.length === 1) {
        return similarity(postToRate, postsToRateBy[0].post)
    }


    const simAndScore: { similarity: number, score: number }[] = [] //similarity of each post and its score
    let minScore = Infinity
    let maxScore = -Infinity
    for (const { post: postToRateBy, score } of postsToRateBy) {
        if (!postToRateBy) {
            console.log(`the post with a score ${score} is giving a value of ${postToRateBy}`)
        }

        simAndScore.push({
            similarity: similarity(postToRate, postToRateBy),
            score: score
        })
        if (score < minScore) {
            minScore = score
        }
        if (score > maxScore) {
            maxScore = score
        }
    }

    function happiness(score: number): number {
        /*
        If postToRate were positioned *here* on the scale from high score to low score, how "happy" would the simAndScores be?
        "unsim": unsimilarity, or 100% - %similarity
        "distance per unsim": amount of distance from each of postsToRateBy to postToRate divided by their percent unsimilarity to postToRate. The idea is that, in the final arrangement, the distance per unsim should be consistent across all postsToRateBy.
        */

        const distPerUnsims: number[] = [] //distance per percent unsimilarity
        for (const { similarity, score: scoreOfPTRB } of simAndScore) {
            const dist = Math.abs(score - scoreOfPTRB)
            const percentUnsim = 1 - similarity
            distPerUnsims.push(dist / percentUnsim)
        }

        let totalDistPerUnsim = 0
        for (const distPerUnsim of distPerUnsims) {
            totalDistPerUnsim += distPerUnsim
        }
        const avgDistPerUnsim = totalDistPerUnsim / distPerUnsims.length

        let totalSquareDifference = 0
        for (const distPerUnsim of distPerUnsims) {
            totalSquareDifference += Math.pow(distPerUnsim - avgDistPerUnsim, 2)
        }

        return -totalSquareDifference
    }


    let bestGuess: undefined | number = undefined
    let bestHappiness = -Infinity
    for (let n = minScore; n <= maxScore; n += (maxScore - minScore) / 20) {
        if (!bestGuess) {
            bestGuess = n
            bestHappiness = happiness(bestGuess)
            continue
        }

        const happinessOfN = happiness(n)
        if (happinessOfN > bestHappiness) {
            bestGuess = n
            bestHappiness = happinessOfN
        }
    }

    return bestGuess!
}

export function similarity(postA: Post, postB: Post): number {
    //calculates the similarity between two posts by looking at how many of their tags are the same.
    const tagsA = postA.tags
    const tagsB = postB.tags

    let tagsInCommon = 0
    if (tagsA.size < tagsB.size) {
        for (const tag of tagsA.values()) {
            if (tagsB.has(tag)) {
                tagsInCommon++
            }
        }
    } else {
        for (const tag of tagsB.values()) {
            if (tagsA.has(tag)) {
                tagsInCommon++
            }
        }
    }

    const percCommonA = tagsInCommon / tagsA.size
    const percCommonB = tagsInCommon / tagsB.size
    const avgPercCommon = (percCommonA + percCommonB) / 2
    return pow2(avgPercCommon, 2)
}