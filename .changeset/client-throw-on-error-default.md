---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Set generated Fetch and Axios operations' error behavior and return types together with `throwOnErrorDefault`.
Copied Fetch and Axios runtimes now follow the TypeScript parser's import extension setting, including `.ts` for Node's native TypeScript execution.

```typescript
pluginFetch({ throwOnErrorDefault: false })
// or pluginAxios({ throwOnErrorDefault: false })

const result = await getPetById({ path: { petId: 1 } })
if (result.error) console.error(result.error)
```
