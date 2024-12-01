import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { Post } from "../../../R34-Tools/src/classes/Post.js";
import { SortedSample } from "../../../R34-Tools/src/classes/SortedSample.js";
import { getCommonness, getPosts } from "../../../R34-Tools/src/functions/general_functions/end_user.js";

export class l2TagRater {
    ttrb: string
    tagData: { [tag: string]: { census: Census, com: number } } | undefined
    l1TagList: string[] | undefined
    initialized: boolean

    constructor(ttrb: string) {
        this.ttrb = ttrb
        this.initialized = false
    }
    async init() {
        console.log("began initialization")
        //general sample
        const generalSample = new SortedSample(await getPosts("", 100000, { lookInCache: false, storeInCache: false }))
        console.log("finished general sample")

        //compile list of level 1 tags
        this.l1TagList = []
        for (const { tag } of generalSample.topTags(1000)) {
            if (tag === this.ttrb) { continue }
            this.l1TagList.push(tag)
        }

        //fill this.tagData
        this.tagData = {}

        //fetch commonness values
        const l1ComPromises: Promise<number>[] = []
        for (const l1Tag of this.l1TagList) {
            l1ComPromises.push(getCommonness(l1Tag))
        }
        const l1Coms = await Promise.all(l1ComPromises)//promise.all returns in same order as it was given
        console.log("finished awaiting commonnesses of l1Tags")
        //put data into this.tagData
        for (let i = 0; i < this.l1TagList.length; i++) {
            const l1Tag = this.l1TagList[i]
            const com = l1Coms[i]
            this.tagData[l1Tag] = {
                census: new Census(generalSample.fetchPosts(l1Tag)),
                com: com
            }
        }

        //put ttrb data into this.tagData
        this.tagData[this.ttrb] = {
            census: new Census(await getPosts(this.ttrb, 50000, { lookInCache: false, storeInCache: false })),
            com: await getCommonness(this.ttrb)
        }


        //mark this as initialized
        this.initialized = true
        console.log("initilized: " + this.initialized)
    }

    async rateTag(ttr: string): Promise<number> {
        if (!this.initialized) {
            throw new Error(`Cannot rate tag because tagRater is not initialized`)
        }

        //1: p(a|b) = p(b|a)*(p(a)/p(b)) (Baye's Theorum)
        //2: p(a|b)*p(b|c) = p(a|c) (I'm starting to think this is not right)
        //3: p(ttrb|ttr) = p(ttr|ttrb)*(p(ttrb)/p(ttr)) (1)
        //4: p(ttr|ttrb) = p(ttr|l1Tag)*p(l1Tag|ttrb) (2)
        //5: p(ttrb|ttr) = p(ttr|l1Tag)*p(l1Tag|ttrb)*(p(ttrb)/p(ttr)) (3)(4)

        //then divide each by p(ttrb) to normalize it, and then take geometric mean (which is just like taking the arithmetic mean in log space)
        //then multiply p(ttrb) again if you want to express it as a probability

        //LATER:
        //Okay I'm just going to try and calculate it as if it's not possible for l1Tag1 to occur without ttrb. And so I'll have a bunch of these improbable occurences (for instance, l1Tag1 and ttrb occur, or maybe l1Tag2 and ttrb occur) and I'll say the odds of ttrb is the odds of any one of those occurences occuring.

        //LATERER:
        //I'm going back to taking a weighted average, I think. I'll say "if 10% of posts with l1Tag1 have ttrb, and 20% of posts with l1Tag2 have ttrb, and these are both tags that show up in ttr, then I'll just consider the percent of ttrb in ttr to be aproximately the average between 10% and 20%, weighted by whether l1Tag1 or l1Tag2 has a bigger influence in ttr."
        //so p(ttrb|ttr) = average of: p(ttrb|l1Tag1) weighted by p(l1Tag1|ttr), p(ttrb|l1Tag2) weighted by p(l1Tag2|ttr), etc.
        //p(ttrb|l1Tag1) = p(l1Tag1|ttrb)*(p(ttrb)/p(l1Tag1))
        //p(l1Tag1|ttr) = p(ttr|l1Tag1)*(p(l1Tag1)/p(ttr))
        //numerator: p(ttr|l1Tag1)*p(l1Tag1|ttrb)*(p(ttrb)/p(ttr)) + p(ttr|l1Tag2)*p(l1Tag2|ttrb)*(p(ttrb)/p(ttr)) + ... p(ttr|l1Tagn)*p(l1Tagn|ttrb)*(p(ttrb)/p(ttr))
        //denominator: p(l1Tag1|ttr) + p(l1Tag2|ttr) + ... + p(l1Tagn|ttr)
        //p(l1Tag1|ttr) = p(ttr|l1Tag1)*(p(l1Tag1)/p(ttr))
        //denominator: p(ttr|l1Tag1)*(p(l1Tag1)/p(ttr)) + p(ttr|l1Tag2)*(p(l1Tag2)/p(ttr)) + ... + p(ttr|l1Tagn)*(p(l1Tagn)/p(ttr))
        //this means that I'll have to rebuild a little so that I have values for the commonness of each l1Tag

        const comTtr = await getCommonness(ttr)

        let numerator = 0
        let denominator = 0
        for (const l1Tag of this.l1TagList!) {
            if (l1Tag === ttr) { continue }
            const probTtrGivenL1Tag = this.tagData![l1Tag].census.percent(ttr, { plusOneBuffer: true })
            const probl1TagGivenTtrb = this.tagData![this.ttrb].census.percent(l1Tag, { plusOneBuffer: true })
            numerator += probTtrGivenL1Tag * probl1TagGivenTtrb
            denominator += probTtrGivenL1Tag * this.tagData![l1Tag].com
        }
        numerator *= this.tagData![this.ttrb].com
        const totalProb = numerator / denominator
        const relProb = totalProb / this.tagData![this.ttrb].com

        console.log(`relative probability of ${ttr} is ${relProb}`)

        return totalProb
    }

    async ratePost(post: Post): Promise<number> {
        const tagRatingPromises: Promise<number>[] = []
        for (const tag of post.tags.values()) {
            if (tag === this.ttrb) { continue }
            tagRatingPromises.push(this.rateTag(tag))
        }

        const ratings = await Promise.all(tagRatingPromises)

        let sumOfLogs = 0
        for (const rating of ratings) {
            sumOfLogs += Math.log10(rating / this.tagData![this.ttrb].com)
        }
        const product = Math.pow(10, sumOfLogs)
        return product
    }
}