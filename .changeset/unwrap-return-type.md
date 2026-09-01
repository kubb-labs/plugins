---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Add a `returnType` option (`'full' | 'data'`, default `'full'`) to the standalone client
functions and the class-based SDK. Set `returnType: 'data'` to have a generated call resolve to
the bare success body instead of the full `{ status, data, error, contentType, request, response }`
result, once `throwOnError` (on by default) rules out the error branch.

```ts
pluginAxios({ returnType: 'data' })
// const pet = await getPetById({ path: { petId: 1 } }) // Pet, not { status, data, ... }
```
