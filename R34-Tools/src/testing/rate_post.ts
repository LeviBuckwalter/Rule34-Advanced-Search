import { getPosts, getProportion, getRelativeProportion } from "../functions/general_functions/end_user.js"

function factorial(n: number): number {
    if (n % 1 !== 0) {
        throw new Error("the factorial function was passed a non integer, which it's not made to handle.")
    }
    if (n < 0) {
        throw new Error("the factorial function was passed a negative number, which it's not made to handle.")
    }

    let product = 1
    while (n > 1) {
        product *= n
        n--
    }
    return product
}

export async function ratePost(
    postId: number,
    tagToRateBy: string,
    tupleSize: number,
    amtTuples: number
): Promise<number> {
    const post = (await getPosts(`id:${postId}`, 1, {}))[0]

    if (tupleSize > post.tags.size) {
        throw new Error("the post doesn't have enough tags to make a tuple of that size")
    }
    const tags: string[] = []
    for (const tag of post.tags.values()) {
        tags.push(tag)
    }
    const n = tags.length
    const k = tupleSize
    const nChooseK = factorial(n) / (factorial(k) * factorial(n - k)) //the amount of unique combinations of size k in a set of size n

    //populate randomTuples:
    const randomTuples: Set<Set<string>> = new Set()
    while (randomTuples.size < Math.min(nChooseK * 0.7, amtTuples)) {
        //make a new random tuple:
        const newTuple: Set<string> = new Set()
        while (newTuple.size < tupleSize) {
            const randomIndex = Math.floor(Math.random() * tags.length)
            const randomTag = tags[randomIndex]
            newTuple.add(randomTag)
        }
        randomTuples.add(newTuple)
    }

    //make prompts from tuples:
    const prompts: string[] = []
    for (const tuple of randomTuples.values()) {
        let prompt = ""
        for (const tag of tuple.values()) {
            prompt += " " + tag
        }
        prompts.push(prompt)
    }

    //search prompts:
    const promises: ReturnType<typeof getRelativeProportion>[] = []
    for (const prompt of prompts) {
        promises.push(getRelativeProportion(tagToRateBy, prompt, {}))
    }
    let avgScore = 0
    let totalDataPoints = 0
    for (let i = 0; i < promises.length; i++) {
        const promise = promises[i]
        const prompt = prompts[i]

        console.log(`prompt: "${prompt}", relative proportion: ${(await promise).relativeProportion}, datapoints: ${(await promise).datapoints}`)

        avgScore += (await promise).relativeProportion * (await promise).datapoints
        totalDataPoints += (await promise).datapoints
    }
    avgScore /= totalDataPoints

    return avgScore
}