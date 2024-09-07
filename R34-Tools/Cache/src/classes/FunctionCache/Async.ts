import { Cache } from "../Cache.js"

/*
9/7/24
Okay, I want to make a change to this. I think I want the async function cache to store promises. Because I think I'm running into a problem, where I'm initiation a huge amount of calls to a function cache at once, and they are each and every one of them saying "is the resolved answer already in the async function cache?" And since they're all initiated in a very short time span, none of them see the resolved answer. What they should instead ask is "Is there already someone who asked the same question as me? If so, I'll go stand next to them and wait for the answer to their question."
*/



export class AsyncFunctionCache<T, F extends (...args: any) => Promise<T>> {
    private func: F
    public cache: Cache<Promise<T>>
    private shelfLife: number | undefined

    constructor(
        func: F,
        maxEntries: number,
        shelfLife: number | undefined
    ) {
        this.func = func
        this.cache = new Cache(maxEntries)
        this.shelfLife = shelfLife
    }

    public call(...params: Parameters<F>): Promise<T> {
        const key: string = JSON.stringify(params)

        const cacheResult = this.cache.retrieve(key)
        if (cacheResult) {
            return cacheResult
        }
        //else:
        const promiseOfFuncResult: Promise<T> = this.func(...params)
        this.cache.store(key, promiseOfFuncResult, this.shelfLife)
        return promiseOfFuncResult
    }
}