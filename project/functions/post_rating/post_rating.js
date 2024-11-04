var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Census } from "../../../R34-Tools/src/classes/Census.js";
import { getCommonness, getPosts, getProportion } from "../../../R34-Tools/src/functions/general_functions/end_user.js";
import { roundTo } from "../general_functions.js";
export function rateTagLvl2(ttr, ttrb, maxCensusSize, maxTagsFromCensus) {
    return __awaiter(this, void 0, void 0, function* () {
        //0 remove empty spaces for safety
        ttr = ttr.replace(" ", "");
        ttrb = ttrb.replace(" ", "");
        /*
        formula:
        p(TTRB|TTR)=(num)/(den)
        num=p(TTRB)*1 + p(TTRB|tOneOne)*p(tOneOne|TTR) + p(TTRB|tOneTwo)*p(tOneTwo|TTR) + ... + p(TTRB|tOneN)*p(tOneN|TTR)
        den = 1 + p(tOneOne|TTR) + p(tOneTwo|TTR) + ... + p(tOneN|TTR)
        */
        //1 find most important level 1 tags
        // console.log(`starting section 1`)
        const l1Tags = new Set();
        //1.1 fetch census of TTR and TTRB
        const censusTtr = new Census(yield getPosts(ttr, (maxCensusSize) ? maxCensusSize : 25000, { lookInCache: false, storeInCache: false }));
        const censusTtrb = new Census(yield getPosts(ttrb, (maxCensusSize) ? maxCensusSize : 25000, { lookInCache: false, storeInCache: false }));
        //1.2 select most important tags from censuses
        const maxTags = (maxTagsFromCensus) ? maxTagsFromCensus : 300;
        for (const { tag } of censusTtr.toArray(maxTags)) {
            l1Tags.add(tag);
        }
        for (const { tag } of censusTtrb.toArray(maxTags)) {
            l1Tags.add(tag);
        }
        l1Tags.delete(ttr);
        l1Tags.delete(ttrb);
        //2 fetch all values needed for calculation
        // console.log(`starting section 2`)
        const comTtrb = getCommonness(ttrb);
        const l1TagsData = {};
        for (const l1Tag of l1Tags.values()) {
            l1TagsData[l1Tag] = {
                implicationToTtrb: getProportion(ttrb, l1Tag, { plusOneBuffer: true }),
                implicationFromTtr: getProportion(l1Tag, ttr, { plusOneBuffer: true })
            };
        }
        //3 calculate formula
        // console.log(`starting section 3`)
        let num = 0;
        let den = 0;
        num += (yield comTtrb) * 1;
        den += 1;
        for (const l1Tag of l1Tags) {
            const numDelta = (yield l1TagsData[l1Tag].implicationToTtrb) * (yield l1TagsData[l1Tag].implicationFromTtr);
            const denDelta = yield l1TagsData[l1Tag].implicationFromTtr;
            num += numDelta;
            den += denDelta;
            console.log(`"${l1Tag}":`);
            console.log(`"${ttr}" implies "${l1Tag}" by ${roundTo((yield l1TagsData[l1Tag].implicationFromTtr) * 100, 4)}%`);
            console.log(`"${l1Tag}" implies "${ttrb}" by ${roundTo((yield l1TagsData[l1Tag].implicationToTtrb) * 100, 4)}%`);
            console.log(`numDelta: ${numDelta}`);
            console.log(`denDelta: ${denDelta}`);
        }
        return num / den;
    });
}
2;
