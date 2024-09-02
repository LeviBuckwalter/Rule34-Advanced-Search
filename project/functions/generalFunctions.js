export function smartGetElement(id, constructor) {
    const idReturn = document.getElementById(id);
    if (idReturn && idReturn instanceof constructor) {
        return idReturn;
    }
    else {
        throw new Error(`The element under the id "${id}" was expected to be an instance of ${constructor}, but instead it was ${idReturn}.`);
    }
}
export function pow2(base, exponent) {
    //this function does the same as Math.pow, except it keeps the original sign of the base (negative or positive)
    return Math.abs(Math.pow(base, exponent)) * ((base < 0) ? -1 : 1);
}
