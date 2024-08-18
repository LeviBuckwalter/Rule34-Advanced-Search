export function smartGetElement<T extends HTMLElement>(id: string, constructor: new () => T): T {
    const idReturn = document.getElementById(id)
    if (idReturn && idReturn instanceof constructor) {
        return idReturn
    } else {
        throw new Error(`The element under the id "${id}" was expected to be an instance of ${constructor}, but instead it was ${idReturn}.`)
    }
}