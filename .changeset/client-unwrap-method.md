---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Generated calls now return a promise with an extra `unwrap()` method. Calling it gives you the bare
success body, or rejects with `error` when the call was made with `throwOnError: false`.

```ts
const { data, error } = await getPetById({ path: { petId: 1 } })
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
```

Awaiting the call directly still gives the full result, so nothing existing changes.

`plugin-react-query`, `plugin-vue-query`, and `plugin-swr` now build their generated query and
mutation bodies on top of `unwrap()` too, instead of destructuring the result by hand.
