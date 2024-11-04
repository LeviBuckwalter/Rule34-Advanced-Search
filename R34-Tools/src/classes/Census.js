export class Census {
    constructor(given) {
        this.counts = new Map();
        this.size = 0;
        for (const post of given) {
            this.size++;
            for (const tag of post.tags.values()) {
                if (this.counts.has(tag)) {
                    this.counts.set(tag, this.counts.get(tag) + 1);
                }
                else {
                    this.counts.set(tag, 1);
                }
            }
        }
    }
    count(tag) {
        if (this.counts.has(tag)) {
            return this.counts.get(tag);
        }
        else {
            return 0;
        }
    }
    percent(tag, options = {}) {
        const { plusOneBuffer = false } = options;
        const buffer = (plusOneBuffer) ? 1 : 0;
        return (this.count(tag) + buffer) / (this.size + buffer);
    }
    toArray(amtTags) {
        const ret = [];
        for (const [tag, count] of this.counts.entries()) {
            ret.push({ tag: tag, count: count });
        }
        ret.sort(function (a, b) {
            return b.count - a.count;
        });
        if (amtTags) {
            return ret.slice(0, amtTags);
        }
        else {
            return ret;
        }
    }
}
