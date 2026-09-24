---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Configure the generated client's error behavior and return types together with `throwOnErrorDefault`.

```typescript
pluginFetch({ throwOnErrorDefault: false })
// or pluginAxios({ throwOnErrorDefault: false })

const result = await getPetById({ path: { petId: 1 } })
if (result.error) console.error(result.error)
```
