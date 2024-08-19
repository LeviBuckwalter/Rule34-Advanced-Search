import { Cache } from "../Cache.js"


export class AsyncFunctionCache<F extends (...args: any) => Promise<any>> {
    private func: F
    public cache: Cache<ReturnType<F>>
    private shelfLife: number | undefined

    constructor(
        func: F,
        name: string,
        maxEntries: number,
        shelfLife: number | undefined
    ) {
        this.func = func
        this.cache = new Cache(name, maxEntries)
        this.shelfLife = shelfLife
    }

    public async call(...params: Parameters<F>): Promise<ReturnType<F>> {
        const key: string = JSON.stringify(params)

        const cacheResult = this.cache.retrieve(key)
        if (cacheResult) {
            return cacheResult
        }
        //else:
        const funcResult = await this.func(...params)
        this.cache.store(key, funcResult, this.shelfLife)
        return funcResult
    }
}