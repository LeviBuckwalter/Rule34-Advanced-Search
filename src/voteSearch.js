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
const ratedPosts = new Map(); //a map of postIds to posts for all the posts that have been voted on
const votes = new Map(); //a map of postIds to scores
let selectedPost; //the post currently being displayed and voted on
let searchedPosts; //the posts that have been scored by the search function (not all of these are neccesarily being displayed)
let searchPageNumber = 1;
let postsPerPage = 20;
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
function rate(rating) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedPost) {
            if (rating === 0 || !votes.has(selectedPost.id)) {
                votes.set(selectedPost.id, rating);
            }
            else {
                votes.set(selectedPost.id, votes.get(selectedPost.id) + rating);
            }
            ratedPosts.set(selectedPost.id, selectedPost);
            resetDisplay();
        }
    });
}
function search() {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        this function uses the information gathered through votes to replace the current searchedPosts with new posts. It looks at tag commonnesses and constructs a search prompt that will return not too many and not too few posts (hopefully).
        It does not reset the display - that's another function's jurisdiction.
        */
        const scope = smartGetElement("scopeInput", HTMLInputElement).value;
        if (ratedPosts.size === 0) {
            searchedPosts = yield getPosts(scope, 1000, {});
            return;
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
        const tags = []; //an array of all tags found in votedPosts
        const tagsToVotes = new Map(); //a map of every tag with its vote data
        for (const post of ratedPosts.values()) {
            const vote = votes.get(post.id);
            for (const tag of post.tags.values()) {
                tags.push(tag);
                //is there already an entry for this tag?
                if (tagsToVotes.has(tag)) {
                    //if so, add this score to the existing scores
                    const entry = tagsToVotes.get(tag);
                    entry.totalScore += vote;
                    entry.amtSamples++;
                }
                else {
                    tagsToVotes.set(tag, { totalScore: vote, amtSamples: 1 });
                }
            }
        }
        const tagsWithScore = [];
        //1.2 find totalCount of each tag
        const countAll = getCount("", {});
        const tagsToCounts = new Map();
        for (const tag of tags) {
            tagsToCounts.set(tag, getCount(tag, {}));
        }
        //1.3 use center of mass and count to make score for each tag
        const tagsToScore = new Map();
        for (const tag of tags) {
            const centerOfMass = tagsToVotes.get(tag).totalScore / tagsToVotes.get(tag).amtSamples;
            const commonness = (yield tagsToCounts.get(tag)) / (yield countAll);
            const tagScore = centerOfMass * Math.pow(commonness, 0.1);
            console.log(`tag: "${tag}", centerOfMass: ${centerOfMass}, commonness: ${commonness}, score: ${tagScore}`);
        }
        //2 sort tags by score
        tags.sort(function (a, b) {
            return tagsToScore.get(b) - tagsToScore.get(a);
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
            for (const tag of tags.slice(0, 21)) {
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
            if (!ratedPosts.has(post.id)) {
                goodPosts.push(post);
            }
        }
        posts = goodPosts;
        //6 sort posts
        //6.1 generate a score for each post
        const postScores = new Map(); //mapping postIds to scores
        for (const postToRate of posts) {
            let score = 0;
            for (const votedPost of ratedPosts.values()) {
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
        searchedPosts = posts;
    });
}
function resetDisplay() {
    //rating display
    const rateSpan = smartGetElement("rateSpan", HTMLSpanElement);
    if (selectedPost && votes.has(selectedPost.id)) {
        rateSpan.innerText = `rating: ${votes.get(selectedPost.id)}`;
    }
    else {
        rateSpan.innerHTML = "";
    }
    //selected post display
    const imageDiv = smartGetElement("currentImageDiv", HTMLDivElement);
    if (selectedPost) {
        imageDiv.innerText = "";
        const anchorEle = document.createElement("a");
        anchorEle.href = selectedPost.siteUrl;
        anchorEle.target = "_blank";
        const imageEle = document.createElement("img");
        imageEle.src = selectedPost.mediumImageUrl;
        imageEle.style.maxWidth = "80vw";
        imageEle.style.maxHeight = "80vh";
        imageEle.style.width = "auto";
        imageEle.style.height = "auto";
        anchorEle.appendChild(imageEle);
        const tagsDetails = document.createElement("details");
        let tagsStr = "";
        for (const tag of selectedPost.tags.values()) {
            tagsStr += `${tag}, `;
        }
        tagsStr = tagsStr.slice(0, tagsStr.length - 2);
        tagsDetails.innerText = tagsStr;
        const tagsDetailsSummary = document.createElement("summary");
        tagsDetailsSummary.innerText = "Tags";
        tagsDetails.appendChild(tagsDetailsSummary);
        imageDiv.appendChild(anchorEle);
        imageDiv.appendChild(tagsDetails);
    }
    else {
        imageDiv.innerHTML = "";
        imageDiv.innerText = `[currently no post is selected]`;
    }
    //summary display
    const sumDiv = smartGetElement("summaryDiv", HTMLDivElement);
    sumDiv.innerHTML = "";
    if (ratedPosts.size === 0) {
        sumDiv.innerText = "[there are no rated posts to display]";
    }
    else {
        for (const post of ratedPosts.values()) {
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
                ratedPosts.delete(post.id);
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
    //search display
    const searchPostDisplayDiv = smartGetElement("searchPostDisplay", HTMLDivElement);
    searchPostDisplayDiv.innerHTML = "";
    if (searchedPosts) {
        const postsToDisplay = searchedPosts.slice(postsPerPage * (searchPageNumber - 1), postsPerPage * searchPageNumber);
        for (const post of postsToDisplay) {
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
}
window.onload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield resetAnchor();
        const scope = smartGetElement("scopeInput", HTMLInputElement).value;
        resetDisplay();
    });
};
smartGetElement("ratePlusOne", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield rate(1); });
});
smartGetElement("rateZero", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield rate(0); });
});
smartGetElement("rateMinusOne", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () { yield rate(-1); });
});
smartGetElement("refreshButton", HTMLButtonElement).addEventListener("click", function () {
    return __awaiter(this, void 0, void 0, function* () {
        selectedPost = undefined;
        yield search();
        resetDisplay();
    });
});
smartGetElement("searchPrev", HTMLButtonElement).addEventListener("click", function () {
    if (!searchedPosts) {
        return;
    }
    if (searchPageNumber > 1) {
        searchPageNumber--;
        resetDisplay();
    }
});
smartGetElement("searchNext", HTMLButtonElement).addEventListener("click", function () {
    if (!searchedPosts) {
        return;
    }
    if (searchPageNumber < Math.ceil(searchedPosts.length / postsPerPage)) {
        searchPageNumber++;
        resetDisplay();
    }
});
