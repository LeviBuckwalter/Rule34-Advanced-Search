import { Post } from "../../classes/Post.js"
import { problemStrs } from "../../globals.js";




export function normalizePrompt(prompt: string): string {
    // Trim spaces from the beginning and end of the prompt
    prompt = prompt.trim();

    // Replace multiple spaces with a single space
    prompt = prompt.replace(/\s+/g, ' ');

    return prompt;
}


type rawPost = {
    id: number
    tags: string
    rating: string
    score: number
    comment_count: number
    preview_url: string
}
export function processRawPosts(rawPosts: rawPost[]): Post[] {
    function isSafe(tag: string): boolean {
        let safe = true
        for (const str of problemStrs) {
            if (tag.includes(str)) {
                safe = false
                break;
            }
        }
        return safe
    }
    const processed: Post[] = []
    
    for (const rawPost of rawPosts) {
        let tags: string[] = rawPost.tags.split(" ")
        tags = tags.filter(isSafe)
        const tagsSet: Set<string> = new Set()
        for (const tag of tags) {
            tagsSet.add(tag)
        }
        processed.push(new Post(
            rawPost.id,
            tagsSet,
            rawPost.rating,
            rawPost.score,
            rawPost.comment_count,
            rawPost.preview_url.substring(38, rawPost.preview_url.length-4)
        ))
    }
    return processed
}