var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class FetchConductor {
    constructor(amtChains) {
        this.amtChains = amtChains;
        this.chains = [];
        for (let n = 1; n <= this.amtChains; n++) {
            this.chains.push({ topLink: Promise.resolve(), links: 0 });
        }
    }
    shortestChain() {
        let sc = this.chains[0];
        for (let chain of this.chains) {
            if (chain.links < sc.links) {
                sc = chain;
            }
        }
        return sc;
    }
    normalizeChains() {
        const fewestLinks = this.shortestChain().links;
        for (let chain of this.chains) {
            chain.links -= fewestLinks;
        }
    }
    ticket(egg) {
        const sc = this.shortestChain();
        sc.links++;
        function retThunk() {
            return __awaiter(this, void 0, void 0, function* () {
                yield sc.topLink;
                let tries = 0;
                while (tries <= 5) {
                    try {
                        return yield egg();
                    }
                    catch (_a) {
                        tries++;
                        console.log(`A fetch just failed on attempt #${tries}`);
                    }
                }
                throw new Error(`The fetch conductor was given an egg (${egg}) which keeps throwing an error, even after 5 tries.`);
            });
        }
        const ret = retThunk();
        sc.topLink = ret;
        if (Math.random() < 0.01) {
            this.normalizeChains();
        }
        return ret;
    }
}
