export function smartGetElement(id, constructor) {
    const idReturn = document.getElementById(id);
    if (idReturn && idReturn instanceof constructor) {
        return idReturn;
    }
    else {
        throw new Error(`The element under the id "${id}" was expected to be an instance of ${constructor}, but instead it was ${idReturn}.`);
    }
}
export function instantiateElements(givenObj) {
    /*
    Okay this one's kinda a doozy. Chatgpt helped me write this on 12/9/24.
    The idea is that the type T is the type of the object that's passed in. The given object would look like this:
    {
        litSearch: HTMLInputElement,
        refreshButton: HTMLButtonElement,
        statusDisplay: HTMLSpanElement
    }
    So every key would be a string, every value would be a type of HTMLElement. Hence "T extends { [id: string]: new () => HTMLElement }".
    What the function actually does is takes each of the id keys and plugs it and the HTMLElement type into smartGetElement, getting back an object of the type specified.
    Typescript doesn't know, though, that what it gets back will be the same type as is specified in the entry in T. So when it says "as InstanceType<T[keyof T]>" it's saying "trust me that it will be the correct type".

    Here's chatGPT's explanation:

    This function dynamically creates an object mapping HTML element IDs to their corresponding DOM elements, cast to the specified type.

    Key points:
    1. The type `T` represents the structure of the input object, where:
    - Each key is a string (the HTML element ID).
    - Each value is a constructor function for a type extending `HTMLElement`.

    2. Example input:
    {
        litSearch: HTMLInputElement,
        refreshButton: HTMLButtonElement,
        statusDisplay: HTMLSpanElement
    }

    3. The function uses `smartGetElement` to find elements and assigns them to the `retObj`.

    4. TypeScript doesn't inherently understand that the returned elements will match the types specified in `T`.
   - The `as InstanceType<T[keyof T]>` assertion ensures TypeScript treats them as the correct types.
    */
    const retObj = {};
    for (const id of Object.keys(givenObj)) {
        retObj[id] = smartGetElement(id, givenObj[id]);
    }
    return retObj;
}
export function smartEl(tag, attrs, children) {
    return { tag, attrs, children };
}
// el("div", {}, [
//     "Probability of ",
//     el("a", { href: `https://rule34.xxx/index.php?page=post&s=list&tags=${rateByTag}` }, [rateByTag]),
//     " among posts tagged ",
// ])
export function toHtml(element) {
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
