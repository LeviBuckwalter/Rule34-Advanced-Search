export class Entry<T> {
    contents: T
    expireTS: number | null
    
    constructor(contents: T, expireTS?: number | null) {
        this.contents = contents
        this.expireTS = (expireTS === undefined) ? null : expireTS
    }

    get expired(): boolean {
        if (this.expireTS !== null) {
            return Date.now() > this.expireTS
        } else {
            return false
        }
    }
}