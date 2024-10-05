export function smartGetElement<T extends HTMLElement>(id: string, constructor: new () => T): T {
    const idReturn = document.getElementById(id)
    if (idReturn && idReturn instanceof constructor) {
        return idReturn
    } else {
        throw new Error(`The element under the id "${id}" was expected to be an instance of ${constructor}, but instead it was ${idReturn}.`)
    }
}

type SmartEl = {
    tag: string;
    attrs: { [key: string]: string },
    children: any[]
}

export function smartEl(tag: string, attrs: { [key: string]: string }, children: any[]): SmartEl {
    return { tag, attrs, children }
}

// el("div", {}, [
//     "Probability of ",
//     el("a", { href: `https://rule34.xxx/index.php?page=post&s=list&tags=${rateByTag}` }, [rateByTag]),
//     " among posts tagged ",
// ])

export function toHtml(element: SmartEl | string): Node {
    if (typeof element === "string") {
        return document.createTextNode(element)
    } else {
        const { tag, attrs, children } = element;
        const newElement = document.createElement(tag)
        for (const key in attrs) {
            newElement.setAttribute(key, attrs[key])
        }
        for (const child of children) {
            newElement.appendChild(toHtml(child));
        }
        return newElement;
    }
}


export function pow2(base: number, exponent: number): number {
    //this function does the same as Math.pow, except it keeps the original sign of the base (negative or positive)

    return Math.abs(Math.pow(base, exponent)) * ((base < 0) ? -1 : 1)
}