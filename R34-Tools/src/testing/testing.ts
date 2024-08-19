import { count } from "../functions/API_access/tags.js"
import { getPosts } from "../functions/general_functions/end_user.js"
import { idToTs } from "../functions/general_functions/id_timestamp_conversion.js"

export async function scoresOverTime(tag: string, amtPosts: number) {
    console.log(await count(tag))
    const posts = await getPosts(tag + " sort:score:desc", amtPosts, {})
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        console.log(`${i}, ${post.score}`)
    }
}


export async function amtPostsOverTime(tag: string, amtPosts: number, postsPerPoint: number, ts?: boolean): Promise<void> {
    const posts = await getPosts(tag, amtPosts, {})
    let miniAvg = 0
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        if (ts) {
            miniAvg += idToTs(post.id)/postsPerPoint
        } else {
            miniAvg += post.id/postsPerPoint
        }

        if (i%postsPerPoint === postsPerPoint-1) {
            console.log(`${miniAvg}, ${posts.length - 1 - i}`)
            miniAvg = 0
        }
    }
}


export async function rateOverTime(tag: string, amtPosts: number, amtPoints: number): Promise<void> {
    const posts = await getPosts(tag, amtPosts, {})
    const timeSpan = idToTs(posts[0].id) - idToTs(posts[posts.length-1].id)
    const bucketSize = timeSpan/amtPoints
    
    let minTs = idToTs(posts[posts.length-1].id)
    let tally = 0
    for (let i = posts.length - 1; i >= 0; i--) {
        const postTs = idToTs(posts[i].id)
        if (postTs < minTs + bucketSize) {
            tally++
        } else {
            console.log(`${minTs + bucketSize/2}, ${tally/bucketSize}`)
            tally = 0
            minTs += bucketSize
        }
    }
}