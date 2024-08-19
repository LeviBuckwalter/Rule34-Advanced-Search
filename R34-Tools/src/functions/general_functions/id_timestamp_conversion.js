const dataPoints = [
    { timestamp: 1722071865, id: 10781124 },
    { timestamp: 1721021340, id: 10673422 },
    { timestamp: 1720931702, id: 10664619 },
    { timestamp: 1720130573, id: 10584856 },
    { timestamp: 1703253009, id: 9202919 },
    { timestamp: 1693112648, id: 8523131 },
    { timestamp: 1689801230, id: 8289732 },
    { timestamp: 1687983284, id: 8164351 },
    { timestamp: 1682817631, id: 7833527 },
    { timestamp: 1677725651, id: 7520199 },
    { timestamp: 1663635678, id: 6712977 },
    { timestamp: 1644572837, id: 5682227 },
    { timestamp: 1643904999, id: 5651447 },
    { timestamp: 1642954214, id: 5605298 },
    { timestamp: 1631757626, id: 5096691 },
    { timestamp: 1624028845, id: 4826881 },
    { timestamp: 1600841713, id: 4102903 },
    { timestamp: 1577707259, id: 3553617 },
    { timestamp: 1545513421, id: 3024532 },
    { timestamp: 1507143823, id: 2523861 },
    { timestamp: 1484458810, id: 2253617 },
    { timestamp: 1461190593, id: 2023804 },
    { timestamp: 1429794633, id: 1753617 },
    { timestamp: 1396077527, id: 1523871 },
    { timestamp: 1364412021, id: 1253617 },
    { timestamp: 1337118491, id: 1023618 },
    { timestamp: 1311160807, id: 794153 },
    { timestamp: 1289837130, id: 524006 },
    { timestamp: 1289697098, id: 264363 },
    { timestamp: 1289661970, id: 164476 },
    { timestamp: 1289643743, id: 102403 },
    { timestamp: 1289622597, id: 48347 },
    { timestamp: 1289611616, id: 11053 },
    { timestamp: 1289608656, id: 1531 },
    { timestamp: 1289608336, id: 251 },
    { timestamp: 1289606789, id: 1 }
];
const tsToIdMap = new Map();
for (const dataPoint of dataPoints) {
    tsToIdMap.set(dataPoint.timestamp, dataPoint.id);
}
export function tsToId(givenTs) {
    let recenter = null;
    let older = null;
    for (const rawEntry of tsToIdMap.entries()) {
        const entry = { timestamp: rawEntry[0], id: rawEntry[1] };
        if (entry.timestamp > /*later than*/ givenTs) {
            recenter = entry;
        }
        else if (entry.timestamp < /*earlier than*/ givenTs) {
            older = entry;
            break;
        }
        else /*if entry.timestamp === givenTs*/ {
            //unlikely outcome
            return entry.id;
        }
    }
    if (older === null) {
        throw new Error(`tsToId was given a timestamp (${givenTs}) which is less than all datapoints (the timestamp is from before rule34 has posts?)`);
    }
    if (recenter !== null) /*if givenTs is between two known datapoints*/ {
        const tsSpan = recenter.timestamp - older.timestamp; //the span of time between the older and recenter datapoints
        const givenTsRelOlder = givenTs - older.timestamp; //given timestamp's position relative to older datapoint
        const idSpan = recenter.id - older.id; //the span of post ids between the older and recenter datapoints
        const givenIdRelOlder = idSpan * (givenTsRelOlder / tsSpan); //lerp
        return Math.round(givenIdRelOlder + older.id); //reincorporate the older id and return
    }
    else /*if givenTs is recenter than all known data points*/ {
        let olderer = undefined;
        for (const rawEntry of tsToIdMap.entries()) {
            const entry = { timestamp: rawEntry[0], id: rawEntry[1] };
            if (entry.timestamp < older.timestamp) {
                olderer = entry;
                break;
            }
        }
        const tsSpan = older.timestamp - olderer.timestamp; //the span of time between the older and olderer datapoints
        const givenTsRelOlderer = givenTs - olderer.timestamp; //the milliseconds by which givenTs is recenter than olderer
        const idSpan = older.id - olderer.id; //the span of post ids between the older and olderer datapoints
        const givenIdRelOlderer = idSpan * (givenTsRelOlderer / tsSpan); //lerp
        return Math.round(givenIdRelOlderer + olderer.id); //reincorporate olderer datapoint's post id
    }
}
const idToTsMap = new Map();
for (const dataPoint of dataPoints) {
    idToTsMap.set(dataPoint.id, dataPoint.timestamp);
}
export function idToTs(givenId) {
    let recenter = null;
    let older = null;
    for (const rawEntry of idToTsMap.entries()) {
        const entry = { timestamp: rawEntry[1], id: rawEntry[0] };
        if (entry.id > /*later than*/ givenId) {
            recenter = entry;
        }
        else if (entry.id < /*earlier than*/ givenId) {
            older = entry;
            break;
        }
        else /*if entry.id === givenId*/ {
            //unlikely outcome
            return entry.timestamp;
        }
    }
    if (older === null) {
        throw new Error(`idToTs was given a post id (${givenId}) which is less than all datapoints (the id is negative?)`);
    }
    if (recenter !== null) /*if givenId is between two known datapoints*/ {
        const idSpan = recenter.id - older.id; //the span of post ids between the older and recenter datapoints
        const givenIdRelOlder = givenId - older.id; //given post id's position relative to older datapoint
        const tsSpan = recenter.timestamp - older.timestamp; //the span of time between the older and recenter datapoints
        const givenTsRelOlder = tsSpan * (givenIdRelOlder / idSpan); //lerp
        return Math.round(givenTsRelOlder + older.timestamp); //reincorporate the older timestamp and return
    }
    else /*if givenId is recenter than all known data points*/ {
        let olderer = undefined;
        for (const rawEntry of idToTsMap.entries()) {
            const entry = { timestamp: rawEntry[1], id: rawEntry[0] };
            if (entry.id < older.id) {
                olderer = entry;
                break;
            }
        }
        const idSpan = older.id - olderer.id; //the span of post ids between the older and olderer datapoints
        const givenIdRelOlderer = givenId - olderer.id; //the post ids by which givenId is recenter than olderer
        const tsSpan = older.timestamp - olderer.timestamp; //the span of time between the older and olderer datapoints
        const givenTsRelOlderer = tsSpan * (givenIdRelOlderer / idSpan); //lerp
        return Math.round(givenTsRelOlderer + olderer.timestamp); //reincorporate olderer datapoint's timestamp
    }
}
export function dateToId(date) {
    const milliseconds = date.getTime();
    const seconds = milliseconds / 1000;
    return tsToId(seconds);
}
export function idToDate(id) {
    const seconds = idToTs(id);
    const milliseconds = seconds * 1000;
    return new Date(milliseconds);
}
export function easyDate(month, day, year) {
    if (year < 100) {
        year += 2000;
    }
    return new Date(year, month - 1, day);
}
