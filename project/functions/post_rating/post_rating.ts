import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { getCommonness, getPosts, getProportion } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { roundTo } from "../general_functions.js";




export async function rateTagLvl2(ttr: string, ttrb: string, maxCensusSize?: number, maxTagsFromCensus?: number): Promise<number> {
    //0 remove empty spaces for safety
    ttr = ttr.replace(" ", "")
    ttrb = ttrb.replace(" ", "")

    /*
    formula:
    p(TTRB|TTR)=(num)/(den)
    num=p(TTRB)*1 + p(TTRB|tOneOne)*p(tOneOne|TTR) + p(TTRB|tOneTwo)*p(tOneTwo|TTR) + ... + p(TTRB|tOneN)*p(tOneN|TTR)
    den = 1 + p(tOneOne|TTR) + p(tOneTwo|TTR) + ... + p(tOneN|TTR)
    */

    //1 find most important level 1 tags
    // console.log(`starting section 1`)
    const l1Tags: Set<string> = new Set()
    //1.1 fetch census of TTR and TTRB
    const censusTtr = new Census(await getPosts(ttr, (maxCensusSize) ? maxCensusSize : 25000, { lookInCache: false, storeInCache: false }))
    const censusTtrb = new Census(await getPosts(ttrb, (maxCensusSize) ? maxCensusSize : 25000, { lookInCache: false, storeInCache: false }))
    //1.2 select most important tags from censuses
    const maxTags = (maxTagsFromCensus) ? maxTagsFromCensus : 300
    for (const { tag } of censusTtr.toArray(maxTags)) {
        l1Tags.add(tag)
    }
    for (const { tag } of censusTtrb.toArray(maxTags)) {
        l1Tags.add(tag)
    }
    l1Tags.delete(ttr)
    l1Tags.delete(ttrb)

    //2 fetch all values needed for calculation
    // console.log(`starting section 2`)
    const comTtrb = getCommonness(ttrb)
    const l1TagsData: {
        [tag: string]: {
            implicationToTtrb: Promise<number>,
            implicationFromTtr: Promise<number>
        }
    } = {}
    for (const l1Tag of l1Tags.values()) {
        l1TagsData[l1Tag] = {
            implicationToTtrb: getProportion(ttrb, l1Tag, { plusOneBuffer: true }),
            implicationFromTtr: getProportion(l1Tag, ttr, { plusOneBuffer: true })
        }
    }

    //3 calculate formula
    // console.log(`starting section 3`)
    let num = 0
    let den = 0
    num += (await comTtrb) * 1
    den += 1

    for (const l1Tag of l1Tags) {
        const numDelta = (await l1TagsData[l1Tag].implicationToTtrb) * (await l1TagsData[l1Tag].implicationFromTtr)
        const denDelta = await l1TagsData[l1Tag].implicationFromTtr
        num += numDelta
        den += denDelta

        console.log(`"${l1Tag}":`)
        console.log(`"${ttr}" implies "${l1Tag}" by ${roundTo((await l1TagsData[l1Tag].implicationFromTtr) * 100, 4)}%`)
        console.log(`"${l1Tag}" implies "${ttrb}" by ${roundTo((await l1TagsData[l1Tag].implicationToTtrb) * 100, 4)}%`)
        console.log(`numDelta: ${numDelta}`)
        console.log(`denDelta: ${denDelta}`)
    }

    return num / den
} 2