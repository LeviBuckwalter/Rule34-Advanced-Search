var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Cache } from "../Cache.js";
export class SyncFunctionCache {
    constructor(func, name, maxEntries, shelfLife) {
        this.func = func;
        this.cache = new Cache(name, maxEntries);
        this.shelfLife = shelfLife;
    }
    call(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = JSON.stringify(params);
            const cacheResult = this.cache.retrieve(key);
            if (cacheResult) {
                return cacheResult;
            }
            //else:
            const funcResult = this.func(...params);
            this.cache.store(key, funcResult, this.shelfLife);
            return funcResult;
        });
    }
}
