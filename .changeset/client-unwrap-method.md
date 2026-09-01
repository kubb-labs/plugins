---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Every generated call now resolves to a promise with an extra `unwrap()` method, Redux-Toolkit-style:
`unwrap()` resolves to the bare success body, or rejects with `error` for a result that carried one.
`await getPetById(...)` still resolves to the full `{ status, data, error, contentType, request, response }`
result as before, so this is additive.

```ts
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
```
