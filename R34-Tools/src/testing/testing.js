var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { count } from "../functions/API_access/tags.js";
import { getPosts } from "../functions/general_functions/end_user.js";
import { idToTs } from "../functions/general_functions/id_timestamp_conversion.js";
export function scoresOverTime(tag, amtPosts) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(yield count(tag));
        const posts = yield getPosts(tag + " sort:score:desc", amtPosts, {});
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            console.log(`${i}, ${post.score}`);
        }
    });
}
export function amtPostsOverTime(tag, amtPosts, postsPerPoint, ts) {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = yield getPosts(tag, amtPosts, {});
        let miniAvg = 0;
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            if (ts) {
                miniAvg += idToTs(post.id) / postsPerPoint;
            }
            else {
                miniAvg += post.id / postsPerPoint;
            }
            if (i % postsPerPoint === postsPerPoint - 1) {
                console.log(`${miniAvg}, ${posts.length - 1 - i}`);
                miniAvg = 0;
            }
        }
    });
}
export function rateOverTime(tag, amtPosts, amtPoints) {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = yield getPosts(tag, amtPosts, {});
        const timeSpan = idToTs(posts[0].id) - idToTs(posts[posts.length - 1].id);
        const bucketSize = timeSpan / amtPoints;
        let minTs = idToTs(posts[posts.length - 1].id);
        let tally = 0;
        for (let i = posts.length - 1; i >= 0; i--) {
            const postTs = idToTs(posts[i].id);
            if (postTs < minTs + bucketSize) {
                tally++;
            }
            else {
                console.log(`${minTs + bucketSize / 2}, ${tally / bucketSize}`);
                tally = 0;
                minTs += bucketSize;
            }
        }
    });
}
