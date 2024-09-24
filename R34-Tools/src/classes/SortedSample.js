export class SortedSample {
    constructor(posts) {
        this.postIdsByTag = new Map();
        this.postByPostId = new Map();
        this.size = posts.length;
        //initialization:
        for (const post of posts) {
            this.postByPostId.set(post.id, post);
            for (const tag of post.tags.values()) {
                if (!this.postIdsByTag.has(tag)) {
                    this.postIdsByTag.set(tag, new Set());
                }
                this.postIdsByTag.get(tag).add(post.id);
            }
        }
    }
    fetchPosts(...tags) {
        //allowing for entering no tags, to make more consistent with the rest of rule34 type searches
        if (tags.length === 0 || (tags.length === 1 && tags[0] === "")) {
            return Array.from(this.postByPostId.values());
        }
        //if there are no posts in the sample that have the first tag, stop right away
        if (!this.postIdsByTag.has(tags[0])) {
            return [];
        }
        //initialize postIds as all postIds from the sample that have the first given tag
        let postIds = Array.from(this.postIdsByTag.get(tags[0]));
        for (const tag of tags) {
            //whittle down postIds
            if (tag === tags[0]) {
                continue;
            } //we already did this one
            if (!this.postIdsByTag.has(tag)) {
                return [];
            }
            postIds = postIds.filter((postId) => this.postIdsByTag.get(tag).has(postId));
            if (postIds.length === 0) {
                return [];
            }
        }
        //turn postIds into posts
        let posts = [];
        for (const postId of postIds) {
            posts.push(this.postByPostId.get(postId));
        }
        return posts;
    }
    commonness(...tags) {
        //+1 and +2 so that it's never o or infinity
        return (this.fetchPosts(...tags).length + 1) / (this.size + 2);
    }
}
