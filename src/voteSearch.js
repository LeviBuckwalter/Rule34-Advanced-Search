var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { smartGetElement } from "./functions.js";
import { getPosts } from "../R34-Tools/src/functions/general_functions/end_user.js";
import { getCount } from "../R34-Tools/src/caches/prompt_count_cache/PromptCount$_functions.js";
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js";
const passedPosts = new Set(); //a set containing the ids of posts which the user has "passed" on
const votedPosts = new Map(); //a map of postIds to posts for all the posts that have been voted on
const scores = new Map(); //a map of postIds to scores
let currentPost; //the post currently being displayed and voted on
function tuple(pt) {
    return (pt.sort()).join("+");
}
function untuple(tuple) {
    return tuple.split("+");
}
function tupleSet(tags) {
    const tagsArray = [];
    for (const tag of tags.values()) {
        tagsArray.push(tag);
    }
    const protoTuples = [];
    //fill protoTuples:
    //only built for making couples rn
    for (let i = 0; i < tagsArray.length; i++) {
        const tagA = tagsArray[i];
        const viableBTags = tagsArray.slice(i + 1, tagsArray.length);
        for (let j = 0; j < viableBTags.length; j++) {
            const tagB = viableBTags[j];
            const newPT = [tagA, tagB];
            protoTuples.push(newPT);
        }
    }
    const tuples = new Set();
    for (const pt of protoTuples) {
        tuples.add(tuple(pt));
    }
    return tuples;
}
function vote(score) {
    return __awaiter(this, void 0, void 0, function* () {
        scores.set(currentPost.id, score);
        votedPosts.set(currentPost.id, currentPost);
        currentPost = yield findNewPost();
        resetDisplay();
    });
}
function findNewPost() {
    return __awaiter(this, void 0, void 0, function* () {
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
        const tupleSetsWithScore = []; //an entry for each post, showing what tuples are in the post and what the post's score is
        for (const post of votedPosts.values()) {
            tupleSetsWithScore.push({
                tupleSet: tupleSet(post.tags),
                score: scores.get(post.id)
            });
        }
        //make a set of all tuples present in all votedPosts
        const allTuples = new Set();
        for (const { tupleSet } of tupleSetsWithScore) {
            for (const tuple of tupleSet.values()) {
                allTuples.add(tuple);
            }
        }
        //assign an avgScore for each tuple by looking at the scores of the posts it's found in
        const tuplesWithAvgScore = [];
        for (const tuple of allTuples.values()) {
            let scoreTotal = 0;
            let scoreInstances = 0;
            for (const { tupleSet, score } of tupleSetsWithScore) {
                if (tupleSet.has(tuple)) {
                    scoreTotal += score;
                    scoreInstances++;
                }
            }
            const avgScore = scoreTotal / scoreInstances;
            tuplesWithAvgScore.push({ tuple, avgScore });
        }
        tuplesWithAvgScore.sort(function (a, b) {
            return b.avgScore - a.avgScore;
        });
        let prompt = "";
        const scope = smartGetElement("scopeInput", HTMLInputElement).value;
        for (const { tuple } of tuplesWithAvgScore) {
            prompt = `${scope} ${untuple(tuple).join(" ")}`;
            const count = yield getCount(prompt, {});
            if (count > 100) {
                break;
            }
            console.log(`The prompt "${prompt}" only has ${count} results, so the next prompt will be checked.`);
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
        const posts = yield getPosts(prompt, 1000, {});
        for (const post of posts) {
            if (!passedPosts.has(post.id) && !votedPosts.has(post.id)) {
                return post;
            }
        }
        //if you get to this point:
        throw new Error(`all ${posts.length} posts have already been passed on/voted on`);
    });
}
function resetDisplay() {
    if (currentPost) {
        smartGetElement("imageElement", HTMLImageElement).src = currentPost.thumbnailUrl;
        smartGetElement("imageLinkElement", HTMLAnchorElement).href = currentPost.siteUrl;
    }
    else {
        console.log("cannot reset the post display because currentPost is undefined");
    }
    const sumDiv = smartGetElement("summaryDiv", HTMLDivElement);
    sumDiv.innerHTML = "";
    for (const post of votedPosts.values()) {
        const score = scores.get(post.id);
        const anchorEle = document.createElement("a");
        anchorEle.href = post.siteUrl;
        const imageEle = document.createElement("img");
        imageEle.src = post.thumbnailUrl;
        anchorEle.appendChild(imageEle);
        const spanEle = document.createElement("span");
        spanEle.textContent = `Score: ${score}`;
        const xButtonEle = document.createElement("button");
        xButtonEle.textContent = "Remove";
        xButtonEle.addEventListener("click", function () {
            votedPosts.delete(post.id);
            resetDisplay();
        });
        const postDiv = document.createElement("div");
        postDiv.appendChild(anchorEle);
        postDiv.appendChild(spanEle);
        postDiv.appendChild(xButtonEle);
        sumDiv.appendChild(postDiv);
    }
}
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
        const scope = smartGetElement("scopeInput", HTMLInputElement).value;
        currentPost = (yield getPosts(scope, 1, {}))[0];
        resetDisplay();
    });
};
smartGetElement("bigYesButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(2); });
});
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
smartGetElement("littleYesButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(1); });
});
smartGetElement("evenStevenButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(0); });
});
smartGetElement("littleNoButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(-1); });
});
smartGetElement("bigNoButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(-2); });
});
smartGetElement("passButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        passedPosts.add(currentPost.id);
        currentPost = yield findNewPost();
        resetDisplay();
    });
});
