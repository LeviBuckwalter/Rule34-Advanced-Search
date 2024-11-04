var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Census } from "../../R34-Tools/src/classes/Census.js";
import { getCommonness, getPosts } from "../../R34-Tools/src/functions/general_functions/end_user.js";
/*
p(ttrb|ttr) = num/den
num = p(ttrb)*1 + p(ttrb|t11)*p(t11|ttr) + p(ttrb|t12)*p(t12|ttr) + ... + p(ttrb|t1n)*p(t1n|ttr)
den =         1       +       p(t11|ttr)       +       p(t12|ttr) + ...      +        p(t1n|ttr)

where:
ttrb = tag to rate by
ttr = tag to rate
t1x = level 1 tag number x
n = number of level 1 tags
p(A|B) = probability of A given B, or the probability by which B implies A

the post rater will need for each calculation:
-p(ttrb)
-p(ttrb|t11), p(ttrb|t12), ... p(ttrb|t1n)
-p(t11|ttr), p(t12|ttr), ... p(t1n|ttr)


I'm already going to need to fetch a census of both ttrb and ttr in order to determine which tags are most important for each.
With the census of ttrb I can determine: not much. I'm gonna have to just use that to find the most important tags for ttrb, and then I'll preload the values for... each p(ttrb|t1x) per level 1 tag...? Hmm... that's not great.

Okay, maybe this is what I'll do:
I will keep around the census for ttrb, and I'll fetch a new census for ttr each time. Then, once I've found which level 1 tags I will be using, I will request p(t1x) for each, and use that value with Baye's Theorum to calculate p(ttrb|t1x). p(t1x|ttr) will come for free with the census of ttr.

So, to reiterate:
Baye's Theorum is p(A|B) = p(B|A)*(p(A)/p(B)))
p(ttrb|t1x) = p(t1x|ttrb)*(p(ttrb)/p(t1x))

p(ttrb|ttr) = num/den
num = p(ttrb)*1 + p(t11|ttrb)*(p(ttrb)/p(t11))*p(t11|ttr) + p(t12|ttrb)*(p(ttrb)/p(t12))*p(t12|ttr) + ... + p(t1n|ttrb)*(p(ttrb)/p(t1n))*p(t1n|ttr)
num = p(ttrb)*(1 + (p(t11|ttrb)*p(t11|ttr))/p(t11) + (p(t12|ttrb)*p(t12|ttr))/p(t12)) + ... + (p(t1n|ttrb)*p(t1n|ttr))/p(t1n))

den = 1 + p(t11|ttr) + p(t12|ttr) + ... + p(t1n|ttr)
*/
export class l2TagRater {
    constructor(ttrb, { ttrCensusSize = 10000, ttrbCensusSize = 100000, maxL1TagsTtr = 250, maxL1TagsTtrb = 250 } = {}) {
        this.initialized = false;
        this.parameters = { ttrCensusSize, ttrbCensusSize, maxL1TagsTtr, maxL1TagsTtrb };
        this.ttrb = ttrb;
        this.topTagsTtrb = new Set();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.comTtrb = yield getCommonness(this.ttrb);
            this.censusTtrb = new Census(yield getPosts(this.ttrb, this.parameters.ttrbCensusSize, { lookInCache: false, storeInCache: false }));
            for (const { tag } of this.censusTtrb.toArray(this.parameters.maxL1TagsTtrb)) {
                this.topTagsTtrb.add(tag);
            }
            this.initialized = true;
        });
    }
    rate(ttr) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                throw new Error("l2TagRater is not initialized yet and can't rate any tags");
            }
            //1 fetch census of tag to rate
            const censusTtr = new Census(yield getPosts(ttr, this.parameters.maxL1TagsTtr, { lookInCache: false, storeInCache: false }));
            //2 assemble list of level 1 tags to include in formula
            const chosenL1Tags = new Set();
            //2.1 add in important tags from census of tag to rate
            for (const { tag } of censusTtr.toArray(250)) {
                chosenL1Tags.add(tag);
            }
            //2.2 add in important tags from census of tag to rate by
            for (const tag of this.topTagsTtrb.values()) {
                chosenL1Tags.add(tag);
            }
            //2.3 remove ttr and ttrb from chosen tags
            chosenL1Tags.delete(this.ttrb);
            chosenL1Tags.delete(ttr);
            //3 fetch and store values needed for calculation
            const l1TagComs = {}; //level 1 tag commonnesses (p(t1x))
            for (const tag of chosenL1Tags.values()) {
                l1TagComs[tag] = getCommonness(tag); //this should use cache
            }
            //4 run calculation
            //p(ttrb|ttr) = num/den
            //num = p(ttrb)*(1 + (p(t11|ttrb)*p(t11|ttr))/p(t11) + (p(t12|ttrb)*p(t12|ttr))/p(t12)) + ... + (p(t1n|ttrb)*p(t1n|ttr))/p(t1n))
            //den = 1 + p(t11|ttr) + p(t12|ttr) + ... + p(t1n|ttr)
            let num = 0;
            let den = 0;
            num += 1;
            den += 1;
            for (const l1Tag of chosenL1Tags) {
                //numerator term: (p(t1x|ttrb)*p(t1x|ttr))/p(t1x)
                const t1xGivenTtrb = this.censusTtrb.percent(l1Tag, { plusOneBuffer: true });
                const t1xGivenTtr = censusTtr.percent(l1Tag, { plusOneBuffer: true });
                const comT1x = yield l1TagComs[l1Tag];
                num += (t1xGivenTtrb * t1xGivenTtr) / comT1x;
                //denominator term: p(t1x|ttr)
                den += t1xGivenTtr;
            }
            num *= this.comTtrb;
            return num / den;
        });
    }
}
