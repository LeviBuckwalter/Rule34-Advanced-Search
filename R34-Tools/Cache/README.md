Old function that might come in handy at a later date:

```ts
export function keysThatStartWith(string: string) {
    const regex = new RegExp(`^${string}.*`);
    const keys = Object.keys(cache.entries);
    return keys.filter((key) => regex.test(key));
}
```
