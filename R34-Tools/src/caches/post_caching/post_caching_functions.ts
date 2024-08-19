import { Post } from "../../classes/Post.js"
import { PostIdsBySearch$ } from "./PostIdsBySearch$.js"
import { PostsByPostId$ } from "./PostsByPostId$.js"
import { postsApi } from "../../functions/API_access/posts.js"
import { General$ } from "../General$.js"


export async function postsApiWithCache(
    prompt: string,
    pid: number,
    options: {
        lookInCache?: boolean,
        storeInCache?: boolean
    }
): Promise<Post[]> {
    const { lookInCache = true, storeInCache = true } = options
    if (lookInCache || storeInCache) {
        const maxId = General$.retrieve("maxId")
        if (!maxId) {
            throw new Error(`maxId is undefined. You probably need to reset the anchor.`)
        }
        prompt = `${prompt} id:<${maxId}`
    }

    const search$Key = PostIdsBySearch$.makeKey(prompt, pid)
    const search$Ret = PostIdsBySearch$.retrieve(search$Key)

    if (lookInCache && search$Ret) {
        const posts: Post[] = []
        for (const postId of search$Ret) {
            const post$Key = PostsByPostId$.makeKey(postId)
            const post$Ret = PostsByPostId$.retrieve(post$Key)
            if (post$Ret) {
                posts.push(post$Ret)
            } else {
                throw new Error(`PostsByPostIds$ returned undefined for the id "${postId}". PostIdsBySearch$ should have returned undefined if not all the posts exist in PostsByPostIds$.`)
            }
        }
        return posts
    }//else:
    const posts = await postsApi(prompt, pid)

    if (storeInCache) {
        const ids: number[] = []
        for (const post of posts) {
            ids.push(post.id)
            const key = PostsByPostId$.makeKey(post.id)
            PostsByPostId$.store(key, post)
        }
        PostIdsBySearch$.store(search$Key, ids)
    }

    return posts
}

export async function resetAnchor(): Promise<void> {
    General$.store("maxId", (await postsApi("", 0, 1))[0].id)
    PostIdsBySearch$.clear()
    PostsByPostId$.clear()
}