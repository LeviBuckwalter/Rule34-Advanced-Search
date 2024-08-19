var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PostIdsBySearch$ } from "./PostIdsBySearch$.js";
import { PostsByPostId$ } from "./PostsByPostId$.js";
import { postsApi } from "../../functions/API_access/posts.js";
import { General$ } from "../General$.js";
export function postsApiWithCache(prompt, pid, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { lookInCache = true, storeInCache = true } = options;
        if (lookInCache || storeInCache) {
            const maxId = General$.retrieve("maxId");
            if (!maxId) {
                throw new Error(`maxId is undefined. You probably need to reset the anchor.`);
            }
            prompt = `${prompt} id:<${maxId}`;
        }
        const search$Key = PostIdsBySearch$.makeKey(prompt, pid);
        const search$Ret = PostIdsBySearch$.retrieve(search$Key);
        if (lookInCache && search$Ret) {
            const posts = [];
            for (const postId of search$Ret) {
                const post$Key = PostsByPostId$.makeKey(postId);
                const post$Ret = PostsByPostId$.retrieve(post$Key);
                if (post$Ret) {
                    posts.push(post$Ret);
                }
                else {
                    throw new Error(`PostsByPostIds$ returned undefined for the id "${postId}". PostIdsBySearch$ should have returned undefined if not all the posts exist in PostsByPostIds$.`);
                }
            }
            return posts;
        } //else:
        const posts = yield postsApi(prompt, pid);
        if (storeInCache) {
            const ids = [];
            for (const post of posts) {
                ids.push(post.id);
                const key = PostsByPostId$.makeKey(post.id);
                PostsByPostId$.store(key, post);
            }
            PostIdsBySearch$.store(search$Key, ids);
        }
        return posts;
    });
}
export function resetAnchor() {
    return __awaiter(this, void 0, void 0, function* () {
        General$.store("maxId", (yield postsApi("", 0, 1))[0].id);
        PostIdsBySearch$.clear();
        PostsByPostId$.clear();
    });
}
