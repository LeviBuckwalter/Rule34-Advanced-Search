import { Cache } from "../../R34-Tools/Cache/src/classes/Cache.js";
export class PostRater {
    constructor(generalSample, rateForCensus, rateForTag) {
        this.parameters = { lvl2RateMaxPosts: 100 };
        this.generalSample = generalSample;
        this.rateForCensus = rateForCensus;
        this.rateByTag = rateForTag;
        this.tagRatingCacheLvl1 = new Cache(50000);
        this.tagRatingCacheLvl2 = new Cache(100000);
    }
    rateTagLvl1(t) {
        /*
        returns the log of the rating of the tag (<0 being a negative association, >0 being a positive association)
        */
        /*
        Baye's Theorum: P(B|A)=P(A|B)*(P(B)/P(A))
        Or in other words: P(rft|t) = P(t|rft) * (c(t)/c(rft))
        Where:
            t = the tag we're trying to get a level 1 rating of
            rft = rateForTag. The tag we are rating t by.
            c(x) = the commonness of the tag x, or the probability of a random post having the tag x
            P(a|b) = the probability of a given b
        */
        //+1 and +2 to avoid 0/x and x/0, plus it kinda gives higher weight to answers with more datapoints
        const probOfTGivenRFT = (this.rateForCensus.count(t) + 1) / (this.rateForCensus.size + 2);
        const commOfT = (this.generalSample.fetchPosts(t).length + 1) / (this.generalSample.size + 2);
        const commOfRFT = (this.generalSample.fetchPosts(this.rateByTag).length + 1) / (this.generalSample.size + 2);
        const probOfRFTGivenT = probOfTGivenRFT * (commOfT / commOfRFT);
        if (Math.random() < 0.001) {
            console.log(`rating "${t}" at level 1. probOfTGivenRFT: ${probOfTGivenRFT}, commOfT: ${commOfT}, commOfRFT: ${commOfRFT}, probOfRFTGivenT: ${probOfRFTGivenT}`);
        }
        return Math.log(probOfRFTGivenT);
        // const amtWithT = this.generalSample.fetchPosts(t, this.rateForTag).length
        // const amtTotal = this.generalSample.fetchPosts(this.rateForTag).length
        // if (amtTotal === 0) {
        //     throw new Error(`The amount of posts in the general sample with this.rateForTag is zero. Either the general sample needs to be bigger (current size: ${this.generalSample.postByPostId.size} posts) or you need to choose a more common tag (current tag: "${this.rateForTag}")`)
        // }
        // return Math.log(amtWithT / amtTotal)
    }
    rateTagLvlN(t, level) {
        /*
        returns either null (meaning there's not enough info to rate the tag) or a number, being the log of the rating of the tag. (<0 being a negative association, >0 being a positive association)
        */
        if (level < 1 || level % 1 !== 0) {
            throw new Error(`level must be a non-zero positive integer`);
        }
        if (level === 1) {
            return this.rateTagLvl1(t);
        }
        //level 2+:
        let postsWithT = this.generalSample.fetchPosts(t);
        if (postsWithT.length > this.parameters.lvl2RateMaxPosts) {
            postsWithT = postsWithT.slice(0, this.parameters.lvl2RateMaxPosts);
        }
        if (postsWithT.length === 0) {
            return Math.log(0.5);
        }
        //else, rate postsWithT:
        let ratings = [];
        for (const postWithT of postsWithT) {
            const rating = this.ratePost(postWithT, level - 1);
            if (rating) {
                ratings.push(rating);
            }
        }
        if (ratings.length === 0) {
            return Math.log(0.5);
        }
        return this.combineProbabilities(...ratings);
    }
    rateTagWithCache(t, level) {
        if (level === 1) {
            const cacheKey = [t, this.rateByTag].join("_");
            const cacheRet = this.tagRatingCacheLvl1.retrieve(cacheKey);
            if (cacheRet) {
                return cacheRet;
            } //else:
            const rating = this.rateTagLvlN(t, level);
            this.tagRatingCacheLvl1.store(cacheKey, rating, 24);
            return rating;
        }
        if (level === 2) {
            const cacheKey = [t, this.rateByTag].join("_");
            const cacheRet = this.tagRatingCacheLvl2.retrieve(cacheKey);
            if (cacheRet) {
                return cacheRet;
            } //else:
            const rating = this.rateTagLvlN(t, level);
            this.tagRatingCacheLvl2.store(cacheKey, rating, 24);
            return rating;
        }
        //else:
        throw new Error(`level !== (1 or 2)`);
    }
    ratePost(p, level) {
        //the level stays the same. If returns null, it means there's not enough information to rate the post.
        let ratings = [];
        for (const t of p.tags.values()) {
            const rating = this.rateTagWithCache(t, level);
            if (rating) {
                ratings.push(rating);
            }
        }
        if (ratings.length === 0) {
            return Math.log(0.5);
        }
        return this.combineProbabilities(...ratings);
    }
    combineProbabilities(...probLogsFor) {
        //takes in the logs of probabilities and returns the log of a probability
        //trueProbFor = 1/(1+naiveProbAgainst/naiveProbFor)
        let forOverAgainstLog = 0;
        for (const probLogFor of probLogsFor) {
            const probFor = Math.pow(10, probLogFor);
            const probAgainst = 1 - probFor;
            forOverAgainstLog += Math.log(probFor / probAgainst);
        }
        const againstOverForNonLog = 1 / Math.pow(10, forOverAgainstLog);
        const trueProbFor = 1 / (1 + againstOverForNonLog);
        return Math.log(trueProbFor);
    }
}
