type Chain = {
    topLink: Promise<unknown>
    links: number
}

export class FetchConductor {
    amtChains: number
    chains: Chain[]
    constructor(amtChains: number) {
        this.amtChains = amtChains
        this.chains = []
        for (let n = 1; n <= this.amtChains; n++) {
            this.chains.push({ topLink: Promise.resolve(), links: 0 })
        }
    }

    shortestChain(): Chain {
        let sc = this.chains[0]
        for (let chain of this.chains) {
            if (chain.links < sc.links) {
                sc = chain
            }
        }
        return sc
    }
    normalizeChains(): void {
        const fewestLinks = this.shortestChain().links
        for (let chain of this.chains) {
            chain.links -= fewestLinks
        }
    }
    ticket<T>(egg: () => Promise<T>): Promise<T> {
        const sc: Chain = this.shortestChain()
        sc.links++
        async function retThunk() {
            await sc.topLink
            let tries = 0
            while (tries <= 5) {
                try {
                    return await egg()
                } catch {
                    tries++
                    console.log(`A fetch just failed on attempt #${tries}`)
                }
            }
            throw new Error(`The fetch conductor was given an egg (${egg}) which keeps throwing an error, even after 5 tries.`)
        }
        const ret = retThunk()
        sc.topLink = ret

        if (Math.random() < 0.01) {
            this.normalizeChains()
        }

        return ret
    }
}