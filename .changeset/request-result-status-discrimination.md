---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Discriminate the `RequestResult` contract by a top-level `status`.

A resolved call now carries its numeric HTTP status as `result.status`, and the result is a union of one variant per documented status. Switching on `result.status` narrows `data` and `error` to that status' payload, so an operation that documents more than one success body (200 vs 201) or several error bodies (400 vs 404) can be handled at the call site:

```ts
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })
switch (result.status) {
  case 200:
    result.data // GetPetByIdStatus200
    break
  case 404:
    result.error // GetPetByIdStatus404
    break
}
```

The change is additive. `data`, `error`, `request`, and `response` keep their shapes, `if (result.error)` still splits success from failure, and `result.status` falls back to `number` for an operation with no documented responses. With `throwOnError` (the default) the result stays the union of the 2xx variants and `error` is `undefined`. `@kubb/plugin-client` injects the same runtime, so its generated output and the query plugins built on it gain the narrowing too.
