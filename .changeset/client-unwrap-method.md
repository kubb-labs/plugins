---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Generated calls now return a promise with an extra `unwrap()` method. Calling it gives you the bare
success body, or rejects with `error` when the call was made with `throwOnError: false`.

```ts
const { data, error } = await getPetById({ path: { petId: 1 } })
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
```

Awaiting the call directly still gives the full result, so nothing existing changes.
