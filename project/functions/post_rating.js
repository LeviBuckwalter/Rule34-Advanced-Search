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
import { getCommonness, getPosts, getProportion } from "../../R34-Tools/src/functions/general_functions/end_user.js";
export function rateTagLvl2(ttr, ttrb, maxCensusSize, maxTagsFromCensus) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        formula:
        p(TTRB|TTR)=(num)/(den)
        num=p(TTRB)*1 + p(TTRB|tOneOne)*p(tOneOne|TTR) + p(TTRB|tOneTwo)*p(tOneTwo|TTR) + ... + p(TTRB|tOneN)*p(tOneN|TTR)
        den = 1 + p(tOneOne|TTR) + p(tOneTwo|TTR) + ... + p(tOneN|TTR)
        */
        //1 find all level 1 tags
        console.log(`starting section 1`);
        const l1Tags = [];
        //1.1 fetch census of TTRB
        const censusTtrb = new Census(yield getPosts(ttrb, (maxCensusSize) ? maxCensusSize : 50000, { lookInCache: false, storeInCache: false }));
        //1.2 make array of tags from census
        for (const { tag } of censusTtrb.toArray((maxTagsFromCensus) ? maxTagsFromCensus : 500)) {
            l1Tags.push(tag);
        }
        //2 fetch all values needed for calculation
        console.log(`starting section 2`);
        const comTtrb = getCommonness(ttrb);
        const l1TagsData = {};
        for (const l1Tag of l1Tags) {
            l1TagsData[l1Tag] = {
                implicationToTtrb: getProportion(ttr, l1Tag),
                implicationFromTtr: getProportion(l1Tag, ttrb)
            };
        }
        //3 calculate formula
        console.log(`starting section 3`);
        let num = 0;
        let den = 0;
        num += (yield comTtrb) * 1;
        den += 1;
        for (const l1Tag of l1Tags) {
            num += (yield l1TagsData[l1Tag].implicationToTtrb) * (yield l1TagsData[l1Tag].implicationFromTtr);
            den += yield l1TagsData[l1Tag].implicationFromTtr;
        }
        return num / den;
    });
}
