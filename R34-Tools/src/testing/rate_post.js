var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getPosts, getRelativeProportion } from "../functions/general_functions/end_user.js";
function factorial(n) {
    if (n % 1 !== 0) {
        throw new Error("the factorial function was passed a non integer, which it's not made to handle.");
    }
    if (n < 0) {
        throw new Error("the factorial function was passed a negative number, which it's not made to handle.");
    }
    let product = 1;
    while (n > 1) {
        product *= n;
        n--;
    }
    return product;
}
export function ratePost(postId, tagToRateBy, tupleSize, amtTuples) {
    return __awaiter(this, void 0, void 0, function* () {
        const post = (yield getPosts(`id:${postId}`, 1, {}))[0];
        if (tupleSize > post.tags.size) {
            throw new Error("the post doesn't have enough tags to make a tuple of that size");
        }
        const tags = [];
        for (const tag of post.tags.values()) {
            tags.push(tag);
        }
        const n = tags.length;
        const k = tupleSize;
        const nChooseK = factorial(n) / (factorial(k) * factorial(n - k)); //the amount of unique combinations of size k in a set of size n
        //populate randomTuples:
        const randomTuples = new Set();
        while (randomTuples.size < Math.min(nChooseK * 0.7, amtTuples)) {
            //make a new random tuple:
            const newTuple = new Set();
            while (newTuple.size < tupleSize) {
                const randomIndex = Math.floor(Math.random() * tags.length);
                const randomTag = tags[randomIndex];
                newTuple.add(randomTag);
            }
            randomTuples.add(newTuple);
        }
        //make prompts from tuples:
        const prompts = [];
        for (const tuple of randomTuples.values()) {
            let prompt = "";
            for (const tag of tuple.values()) {
                prompt += " " + tag;
            }
            prompts.push(prompt);
        }
        //search prompts:
        const promises = [];
        for (const prompt of prompts) {
            promises.push(getRelativeProportion(tagToRateBy, prompt, {}));
        }
        let avgScore = 0;
        let totalDataPoints = 0;
        for (let i = 0; i < promises.length; i++) {
            const promise = promises[i];
            const prompt = prompts[i];
            console.log(`prompt: "${prompt}", relative proportion: ${(yield promise).relativeProportion}, datapoints: ${(yield promise).datapoints}`);
            avgScore += (yield promise).relativeProportion * (yield promise).datapoints;
            totalDataPoints += (yield promise).datapoints;
        }
        avgScore /= totalDataPoints;
        return avgScore;
    });
}
