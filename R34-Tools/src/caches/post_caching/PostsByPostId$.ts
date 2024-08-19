import { Post } from "../../classes/Post.js"
import { Cache } from "../../../Cache/src/classes/Cache.js"

/*
stores posts, indexed by postIds.
*/

export const PostsByPostId$: Cache<Post> = new Cache("PostsByPostId$", 50000)
PostsByPostId$.makeKey = function (postId: number): string {
    return `${postId}`
}