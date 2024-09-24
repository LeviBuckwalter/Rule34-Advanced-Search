import { Cache } from "../Cache.js";
export class SyncFunctionCache {
    constructor(func, maxEntries, shelfLife) {
        this.func = func;
        this.cache = new Cache(maxEntries);
        this.shelfLife = shelfLife;
    }
    call(...params) {
        const key = JSON.stringify(params);
        const cacheResult = this.cache.retrieve(key);
        if (cacheResult) {
            return cacheResult;
        }
        //else:
        const funcResult = this.func(...params);
        this.cache.store(key, funcResult, this.shelfLife);
        return funcResult;
    }
}
