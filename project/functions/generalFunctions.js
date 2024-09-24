export function smartGetElement(id, constructor) {
    const idReturn = document.getElementById(id);
    if (idReturn && idReturn instanceof constructor) {
        return idReturn;
    }
    else {
        throw new Error(`The element under the id "${id}" was expected to be an instance of ${constructor}, but instead it was ${idReturn}.`);
    }
}
function smartEl(tag, attrs, children) {
    return { tag, attrs, children };
}
// el("div", {}, [
//     "Probability of ",
//     el("a", { href: `https://rule34.xxx/index.php?page=post&s=list&tags=${rateByTag}` }, [rateByTag]),
//     " among posts tagged ",
// ])
function toHtml(element) {
    if (typeof element === "string") {
        return document.createTextNode(element);
    }
    else {
        const { tag, attrs, children } = element;
        const newElement = document.createElement(tag);
        for (const key in attrs) {
            newElement.setAttribute(key, attrs[key]);
        }
        for (const child of children) {
            newElement.appendChild(toHtml(child));
        }
        return newElement;
    }
}
export function pow2(base, exponent) {
    //this function does the same as Math.pow, except it keeps the original sign of the base (negative or positive)
    return Math.abs(Math.pow(base, exponent)) * ((base < 0) ? -1 : 1);
}
