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
const votedPosts = new Map(); //a map of postIds to posts for all the posts that have been voted on
const votes = new Map(); //a map of postIds to scores
let selectedPost; //the post currently being displayed and voted on
let searchedPosts; //the posts that are being displayed in the search area
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
function tagsInCommon(tagSetA, tagSetB) {
    let sum = 0;
    if (tagSetA.size < tagSetB.size) {
        for (const tag of tagSetA.values()) {
            if (tagSetB.has(tag)) {
                sum++;
            }
        }
    }
    else {
        for (const tag of tagSetB.values()) {
            if (tagSetA.has(tag)) {
                sum++;
            }
        }
    }
    return sum;
}
function vote(score) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedPost) {
            votes.set(selectedPost.id, score);
            votedPosts.set(selectedPost.id, selectedPost);
            selectedPost = undefined;
            yield search();
            resetDisplay();
        }
    });
}
// async function findNewPost(): Promise<Post> {
//     //make a set of tuples for each post in votedPosts
//     //make a set of all tuples present in all votedPosts
//     //for each tuple, assign a score by looking at the posts it's present in and the score of said posts
//     //factor in statistics somehow, blah blah
//     //perform a search including the #1 best tuple
//     //-> lots of results? exclude the worst tuple and check again (unfortunately I can't exclude an -or- statement, so maybe just exclude the worst singleton)
//     //-> a small enough number of results? Go through each one and score it off of the scores figured out in step 3
//     //the highest scoring post becomes the new currentPost
//     //alphabetize an array of strings by just running sort on it with no function passed in
//     //make a set of tuples for each post in votedPosts
//     const tupleSetsWithScore: { tupleSet: Set<tuple>, score: number }[] = [] //an entry for each post, showing what tuples are in the post and what the post's score is
//     for (const post of votedPosts.values()) {
//         tupleSetsWithScore.push({
//             tupleSet: tupleSet(post.tags),
//             score: scores.get(post.id)!
//         })
//     }
//     //make a set of all tuples present in all votedPosts
//     const allTuples: Set<tuple> = new Set()
//     for (const { tupleSet } of tupleSetsWithScore) {
//         for (const tuple of tupleSet.values()) {
//             allTuples.add(tuple)
//         }
//     }
//     //assign an avgScore for each tuple by looking at the scores of the posts it's found in
//     const tuplesWithAvgScore: { tuple: tuple, avgScore: number }[] = []
//     for (const tuple of allTuples.values()) {
//         let scoreTotal = 0
//         let scoreInstances = 0
//         for (const { tupleSet, score } of tupleSetsWithScore) {
//             if (tupleSet.has(tuple)) {
//                 scoreTotal += score
//                 scoreInstances++
//             }
//         }
//         const avgScore = scoreTotal / scoreInstances
//         tuplesWithAvgScore.push({ tuple, avgScore })
//     }
//     tuplesWithAvgScore.sort(function (a, b) {
//         return b.avgScore - a.avgScore
//     })
//     let prompt = ""
//     const scope = smartGetElement("scopeInput", HTMLInputElement).value
//     for (const { tuple } of tuplesWithAvgScore) {
//         prompt = `${scope} ${untuple(tuple).join(" ")}`
//         const count = await getCount(prompt, {})
//         if (count === 0) {
//             //the prompt is bad
//             continue
//         } else if (count > 200) {
//             //assume the prompt is good
//             break
//         } else {
//             const posts = await getPosts(prompt, 1000, {})
//             let approve = false
//             for (const post of posts) {
//                 if (!passedPosts.has(post.id) && !votedPosts.has(post.id)) {
//                     //the prompt is good
//                     approve = true
//                     break
//                 }
//             }
//             if (approve) { break }
//         }
//         console.log(`The prompt "${prompt}" has ${count} results. The next prompt will be checked.`)
//     }
//     // let amtTuplesInPrompt = 1
//     // let prompt = ""
//     // const scope = smartGetElement("scopeInput", HTMLInputElement).value
//     // let loops = 0
//     // let looping = true
//     // while (looping) {
//     //     const tuples = tuplesWithAvgScore.slice(0, amtTuplesInPrompt)
//     //     //construct prompt from tuples array
//     //     prompt = `${scope} ( `
//     //     for (const { tuple } of tuples) {
//     //         prompt += untuple(tuple).join(" ") + " ~ "
//     //     }
//     //     prompt = prompt.slice(0, -2)
//     //     prompt += ")"
//     //     console.log(`Checking the prompt "${prompt}"...`)
//     //     //check the count of prompt
//     //     if (await getCount(prompt, {}) > 100) {
//     //         looping = false
//     //     } else {
//     //         amtTuplesInPrompt++
//     //     }
//     //     //safety feature
//     //     loops++
//     //     if (loops > 30) {
//     //         throw new Error(`while loop in findNewPost got past 30 loops, shouldn't happen`)
//     //     }
//     // }
//     const posts = await getPosts(prompt, 1000, {})
//     for (const post of posts) {
//         if (!passedPosts.has(post.id) && !votedPosts.has(post.id)) {
//             return post
//         }
//     }
//     //if you get to this point:
//     throw new Error(`all ${posts.length} posts have already been passed on/voted on`)
// }
function search() {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        this function uses the information gathered through votes to replace the current searchedPosts with new posts. It looks at tag commonnesses and constructs a search prompt that will return not too many and not too few posts (hopefully).
        It does not reset the display - that's another function's jurisdiction.
        */
        const scope = smartGetElement("scopeInput", HTMLInputElement).value;
        if (votedPosts.size === 0) {
            searchedPosts = yield getPosts(scope, 100, {});
            return;
        }
        const tagsToVotes = new Map(); //mapping tags to arrays of the scores of the posts they're found in
        let totalVotesYes = 0; //also figure out how many total votes yes and no there are
        let totalVotesNo = 0;
        for (const post of votedPosts.values()) {
            const vote = votes.get(post.id);
            for (const tag of post.tags.values()) {
                //is there already an entry for this tag?
                if (tagsToVotes.has(tag)) {
                    //if so, add this score to the existing scores
                    tagsToVotes.get(tag).push(vote);
                }
                else {
                    tagsToVotes.set(tag, [vote]);
                }
            }
            if (vote > 0) {
                totalVotesYes += vote;
            }
            else if (vote < 0) {
                totalVotesNo += Math.abs(vote);
            }
        }
        const tagsWithScore = [];
        //1.2 find which tags will need to be scored asynchronously and which will not
        const tagsWithoutVotesAgainst = []; //need asynchronous
        const tagsWithVotesForAndAgainst = [];
        for (const entry of tagsToVotes) {
            const tag = entry[0];
            const votes = entry[1];
            if (votes.every(vote => vote >= 0)) {
                tagsWithoutVotesAgainst.push(tag);
            }
            else {
                tagsWithVotesForAndAgainst.push(tag);
            }
        }
        //1.3 calculate scores for asynchronous tags
        //1.3.1 initiate array of promises
        const countAll = getCount("", {});
        const tagsToCounts = new Map();
        for (const tag of tagsWithoutVotesAgainst) {
            tagsToCounts.set(tag, getCount(tag, {}));
        }
        //1.3.2 use array of promises to calculate scores
        for (let i = 0; i < tagsWithoutVotesAgainst.length; i++) {
            const tag = tagsWithoutVotesAgainst[i];
            const tagCount = yield tagsToCounts.get(tag);
            const votes = tagsToVotes.get(tag);
            let tagTotalVotesYes = 0;
            for (const vote of votes) {
                tagTotalVotesYes += vote;
            }
            const commonnessAmongYes = tagTotalVotesYes / totalVotesYes;
            const tagAbsoluteCommonness = tagCount / (yield countAll);
            tagsWithScore.push({
                tag: tag,
                score: commonnessAmongYes / tagAbsoluteCommonness
            });
        }
        //1.4 calculate scores for synchronous tags
        for (const tag of tagsWithVotesForAndAgainst) {
            const votes = tagsToVotes.get(tag);
            let tagTotalVotesYes = 0;
            let tagTotalVotesNo = 0;
            for (const vote of votes) {
                if (vote > 0) {
                    tagTotalVotesYes += vote;
                }
                else if (vote < 0) {
                    tagTotalVotesNo += Math.abs(vote);
                }
            }
            const commonnessAmongYes = tagTotalVotesYes / totalVotesYes;
            const commonnessAmongNo = tagTotalVotesNo / totalVotesNo;
            tagsWithScore.push({
                tag: tag,
                score: commonnessAmongYes / commonnessAmongNo
            });
        }
        //2 sort tags by score
        tagsWithScore.sort(function (a, b) {
            return b.score - a.score;
        });
        //3 construct prompt from tagsWithScore
        let prompt;
        const minPostsInput = smartGetElement("minPostsInput", HTMLInputElement);
        const maxPostsInput = smartGetElement("maxPostsInput", HTMLInputElement);
        if (Number(minPostsInput.value) === 0) {
            minPostsInput.value = `${100}`;
        }
        if (Number(maxPostsInput.value) < Number(minPostsInput.value)) {
            maxPostsInput.value = `${Number(minPostsInput.value) * 2}`;
        }
        const minPosts = Number(minPostsInput.value);
        const maxPosts = Number(maxPostsInput.value);
        const promptDisplayDiv = smartGetElement("promptDisplayDiv", HTMLDivElement);
        if ((yield getCount(scope, {})) < minPosts) {
            //3a if the scope is narrow enough already
            console.log(`determined scope was already narrow enough. prompt = "${scope}"`);
            prompt = scope;
        }
        else {
            //3b.1 create workingPrompt and prompt() framework
            /*
            a workingPrompt like this:
            [feet, armpit, [nsfw, green_eyes, french_fries], femboy]
            would translate to this:
            "feet armpit ( nsfw ~ green_eyes ~ french_fries ) femboy"
    
            so the strings correspond to tags that will be combined via AND, and string arrays are tags that will be combined via OR
            */
            const workingPrompt = [scope];
            function stringifyWorkingPrompt() {
                let p = "";
                for (const term of workingPrompt) {
                    if (term instanceof Array) {
                        let termStr = "( " + term[0];
                        for (let i = 1; i < term.length; i++) {
                            termStr += ` ~ ${term[i]}`;
                        }
                        termStr += " )";
                        p += termStr + " ";
                    }
                    else {
                        p += term + " ";
                    }
                }
                return p;
            }
            //3b.2 use workingPrompt framework to create and test different prompts
            /*
            narrow and widen the prompt repeatedly. If it's too narrow, use the next best tag to OR the most recent tag added to the prompt. If the scope is too broad, add the next best tag to the prompt.
            */
            for (const { tag } of tagsWithScore.slice(0, 21)) {
                const count = yield getCount(stringifyWorkingPrompt(), {});
                promptDisplayDiv.innerText = `Testing the prompt "${stringifyWorkingPrompt()}", which returns ${count} posts...`;
                if (count > maxPosts) {
                    workingPrompt.push(tag);
                }
                else if (count < minPosts) {
                    const finalElement = workingPrompt[workingPrompt.length - 1];
                    if (finalElement instanceof Array) {
                        finalElement.push(tag);
                    }
                    else {
                        workingPrompt[workingPrompt.length - 1] = [finalElement, tag];
                    }
                }
            }
            prompt = stringifyWorkingPrompt();
        }
        promptDisplayDiv.innerText = `Final prompt: "${prompt}", which returns ${yield getCount(prompt, {})} posts.`;
        //4 use prompt to generate posts
        let posts = yield getPosts(prompt, maxPosts, {});
        //5 remove posts already voted on
        const goodPosts = [];
        for (const post of posts) {
            if (!votedPosts.has(post.id)) {
                goodPosts.push(post);
            }
        }
        posts = goodPosts;
        //6 sort posts
        //6.1 generate a score for each post
        const postScores = new Map(); //mapping postIds to scores
        for (const postToRate of posts) {
            let score = 0;
            for (const votedPost of votedPosts.values()) {
                const vote = votes.get(votedPost.id);
                const amtCommonTags = tagsInCommon(votedPost.tags, postToRate.tags);
                const avgAmtTags = (votedPost.tags.size + postToRate.tags.size) / 2;
                score += Math.pow((amtCommonTags / avgAmtTags) * vote, 2);
            }
            postScores.set(postToRate.id, score);
        }
        //6.2 sort posts by score
        posts.sort(function (a, b) {
            return postScores.get(b.id) - postScores.get(a.id);
        });
        //7 set searchedPosts to sorted posts
        searchedPosts = posts.slice(0, Math.min(posts.length, 100));
    });
}
function resetDisplay() {
    //selected post display
    const imageDiv = smartGetElement("currentImageDiv", HTMLDivElement);
    if (selectedPost) {
        imageDiv.innerText = "";
        const anchorEle = document.createElement("a");
        anchorEle.href = selectedPost.siteUrl;
        anchorEle.target = "_blank";
        const imageEle = document.createElement("img");
        imageEle.src = selectedPost.mediumImageUrl;
        imageEle.style.maxWidth = "100vw";
        imageEle.style.maxHeight = "80vh";
        imageEle.style.width = "auto";
        imageEle.style.height = "auto";
        anchorEle.appendChild(imageEle);
        imageDiv.appendChild(anchorEle);
    }
    else {
        imageDiv.innerHTML = "";
        imageDiv.innerText = `[currently no post is selected]`;
    }
    //search display
    const searchPostDisplayDiv = smartGetElement("searchPostDisplay", HTMLDivElement);
    searchPostDisplayDiv.innerHTML = "";
    if (searchedPosts) {
        for (const post of searchedPosts) {
            const imgEle = document.createElement("img");
            imgEle.src = post.thumbnailUrl;
            imgEle.addEventListener("click", function () {
                selectedPost = post;
                resetDisplay();
            });
            searchPostDisplayDiv.appendChild(imgEle);
        }
    }
    else {
        searchPostDisplayDiv.innerText = `[there are no searched posts]`;
    }
    //summary display
    const sumDiv = smartGetElement("summaryDiv", HTMLDivElement);
    sumDiv.innerHTML = "";
    for (const post of votedPosts.values()) {
        const score = votes.get(post.id);
        const anchorEle = document.createElement("a");
        anchorEle.href = post.siteUrl;
        anchorEle.target = "_blank";
        const imgEle = document.createElement("img");
        imgEle.src = post.thumbnailUrl;
        anchorEle.appendChild(imgEle);
        const spanEle = document.createElement("span");
        spanEle.textContent = `Score: ${score}`;
        const plusButton = document.createElement("button");
        plusButton.innerText = "+1";
        plusButton.addEventListener("click", function () {
            votes.set(post.id, score + 1);
            resetDisplay();
        });
        const minusButton = document.createElement("button");
        minusButton.innerText = "-1";
        minusButton.addEventListener("click", function () {
            votes.set(post.id, score - 1);
            resetDisplay();
        });
        const removeButtonEle = document.createElement("button");
        removeButtonEle.textContent = "Remove";
        removeButtonEle.addEventListener("click", function () {
            votedPosts.delete(post.id);
            votes.delete(post.id);
            resetDisplay();
        });
        const postDiv = document.createElement("div");
        postDiv.appendChild(anchorEle);
        postDiv.appendChild(spanEle);
        postDiv.appendChild(minusButton);
        postDiv.appendChild(plusButton);
        postDiv.appendChild(removeButtonEle);
        sumDiv.appendChild(postDiv);
    }
}
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
        const scope = smartGetElement("scopeInput", HTMLInputElement).value;
        resetDisplay();
    });
};
smartGetElement("voteYesButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(1); });
});
smartGetElement("voteNoButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield vote(-1); });
});
smartGetElement("addPostButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const id = Number(smartGetElement("addPostIdInput", HTMLInputElement).value);
        const post = (yield getPosts(`id:${id}`, 1, { lookInCache: false, storeInCache: false }))[0];
        selectedPost = post;
        resetDisplay();
    });
});
smartGetElement("refreshButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield search();
        resetDisplay();
    });
});
