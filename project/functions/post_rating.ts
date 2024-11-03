import { Census } from "../../R34-Tools/src/classes/Census.js";
import { getCommonness, getPosts, getProportion } from "../../R34-Tools/src/functions/general_functions/end_user.js";




export async function rateTagLvl2(ttr: string, ttrb: string, maxCensusSize?: number, maxTagsFromCensus?: number): Promise<number> {
    /*
    formula:
    p(TTRB|TTR)=(num)/(den)
    num=p(TTRB)*1 + p(TTRB|tOneOne)*p(tOneOne|TTR) + p(TTRB|tOneTwo)*p(tOneTwo|TTR) + ... + p(TTRB|tOneN)*p(tOneN|TTR)
    den = 1 + p(tOneOne|TTR) + p(tOneTwo|TTR) + ... + p(tOneN|TTR)
    */

    //1 find all level 1 tags
    console.log(`starting section 1`)

    const l1Tags: string[] = []
    //1.1 fetch census of TTRB
    const censusTtrb = new Census(await getPosts(ttrb, (maxCensusSize) ? maxCensusSize : 50000, { lookInCache: false, storeInCache: false }))
    //1.2 make array of tags from census
    for (const { tag } of censusTtrb.toArray((maxTagsFromCensus) ? maxTagsFromCensus : 500)) {
        l1Tags.push(tag)
    }

    //2 fetch all values needed for calculation
    console.log(`starting section 2`)

    const comTtrb = getCommonness(ttrb)
    const l1TagsData: {
        [tag: string]: {
            implicationToTtrb: Promise<number>,
            implicationFromTtr: Promise<number>
        }
    } = {}
    for (const l1Tag of l1Tags) {
        l1TagsData[l1Tag] = {
            implicationToTtrb: getProportion(ttr, l1Tag),
            implicationFromTtr: getProportion(l1Tag, ttrb)
        }
    }

    //3 calculate formula
    console.log(`starting section 3`)

    let num = 0
    let den = 0
    num += (await comTtrb) * 1
    den += 1

    for (const l1Tag of l1Tags) {
        num += (await l1TagsData[l1Tag].implicationToTtrb) * (await l1TagsData[l1Tag].implicationFromTtr)
        den += await l1TagsData[l1Tag].implicationFromTtr
    }

    return num / den
}