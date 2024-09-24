import { Census } from "../../R34-Tools/src/classes/Census.js"
import { Post } from "../../R34-Tools/src/classes/Post.js"
import { SortedSample } from "../../R34-Tools/src/classes/SortedSample.js"
import { getPosts } from "../../R34-Tools/src/functions/general_functions/end_user.js"
import { PostRater } from "./PostRater.js"

export class Searcher {
    postIdToRating: Map<number, number>
    postIdToPost: Map<number, Post>
    generalSample: SortedSample
    private postRater: PostRater
    rateForTag: string
    literalSearch: string
    going: boolean
    displayCallback: any
    exhaustedTags: Set<string>

    constructor(
        generalSample: SortedSample,
        forCensus: Census,
        rateForTag: string,
        literalSearch: string,
        displayCallback: any
    ) {
        this.postIdToRating = new Map()
        this.postIdToPost = new Map()
        this.generalSample = generalSample
        this.postRater = new PostRater(generalSample, forCensus, rateForTag)
        this.rateForTag = rateForTag
        this.literalSearch = literalSearch
        this.going = false
        this.displayCallback = displayCallback
        this.exhaustedTags = new Set()
    }

    public async go() {
        console.log("searcher told to go")

        this.going = true
        while (this.going) {
            const batch = await this.getNewPostBatch()
            for (const post of batch) {
                const rating = this.postRater.ratePost(post, 2)
                this.postIdToRating.set(post.id, rating!)
                this.postIdToPost.set(post.id, post)
            }
            this.displayCallback()
        }

    }

    public stop() {
        this.going = false
    }

    public get sortedPosts() {
        const ratedPosts = this.ratedPosts
        ratedPosts.sort(function (a, b) {
            return b.rating - a.rating
        })
        const sortedPosts: Post[] = []
        for (const entry of ratedPosts) {
            sortedPosts.push(entry.post)
        }
        return sortedPosts
    }

    private get ratedPosts() {
        const ratedPosts: { post: Post, rating: number }[] = []
        for (const entry of this.postIdToRating) {
            const postId = entry[0]
            const rating = entry[1]
            const post = this.postIdToPost.get(postId)!
            ratedPosts.push({ post, rating })
        }
        return ratedPosts
    }

    private async getNewPostBatch() {
        if (this.postIdToRating.size === 0) {
            return await getPosts(`${this.rateForTag} ${this.literalSearch}`, 10, { lookInCache: false, storeInCache: false })
        }//else:
        //analyze this.ratedPosts and come up with an intelligent search
        //1.1 get rated posts array
        const ratedPosts = this.ratedPosts

        //1.2 rate tags
        //1.2.1 get set of unique tags
        const uniqueTags: Set<string> = new Set()
        for (const { post } of ratedPosts) {
            for (const tag of post.tags.values()) {
                uniqueTags.add(tag)
            }
        }

        //1.2.2 generate score for each tag
        const tagsWithScore: { tag: string, score: number }[] = []
        for (const tag of uniqueTags.values()) {
            let totalRating = 0
            let ratings = 0
            for (const { post, rating } of ratedPosts) {
                if (post.tags.has(tag)) {
                    totalRating += rating
                    ratings++
                }
            }
            if (ratings === 0) {
                throw new Error(`ratings = 0, which shouldn't happen`)
            }
            const avgRating = totalRating / ratings
            const commonness = this.generalSample.commonness(tag)//SortedSample.commonness never returns 0 or infinity
            const score = avgRating - 0.2 * Math.log(commonness)

            tagsWithScore.push({ tag, score })
        }

        //1.3 use tag scores to assemble a search prompt
        tagsWithScore.sort(function (a, b) {
            return b.score - a.score
        })
        let searchTag: string | undefined = undefined
        for (const { tag } of tagsWithScore) {
            if (this.exhaustedTags.has(tag) || Math.random() < 0.5) { continue }
            //else:
            searchTag = tag
            break
        }
        if (!searchTag) {
            throw new Error(`all tags are exhausted...? this probably shouldnt happen`)
        }


        //1.4 use search prompt to return a batch of posts
        const batchSize = 10
        const amtPosts = 1000
        let posts = await getPosts(`${searchTag} ${this.literalSearch}`, amtPosts, { lookInCache: false, storeInCache: false })
        const ratedPostMap = this.postIdToRating
        posts = posts.filter((post) => { return !ratedPostMap.has(post.id) })//get rid of posts that have already been rated
        if (posts.length <= batchSize) {
            this.exhaustedTags.add(searchTag)
            return posts
        } else {
            return posts.slice(0, batchSize)
        }

    }


}