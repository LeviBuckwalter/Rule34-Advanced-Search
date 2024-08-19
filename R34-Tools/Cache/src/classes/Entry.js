export class Entry {
    constructor(contents, expireTS) {
        this.contents = contents;
        this.expireTS = (expireTS === undefined) ? null : expireTS;
    }
    get expired() {
        if (this.expireTS !== null) {
            return Date.now() > this.expireTS;
        }
        else {
            return false;
        }
    }
}
