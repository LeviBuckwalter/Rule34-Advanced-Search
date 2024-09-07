import { Cache } from "../../../Cache/src/classes/Cache.js";
/*
stores posts, indexed by postIds.
*/
export const PostsByPostId$ = new Cache(10000);
PostsByPostId$.makeKey = function (postId) {
    return `${postId}`;
};
