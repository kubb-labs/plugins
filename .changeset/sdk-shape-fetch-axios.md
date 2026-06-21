---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Add an `sdk` option to `pluginFetch` and `pluginAxios`, bringing them closer to `pluginClient`.

`sdk` controls the shape of the generated client and an optional aggregation entry point:

- `sdk: { shape: 'class' }` emits one instance class per tag. The constructor takes a client config and builds its own client, so each environment is a separate instance. A per-call `client` option still overrides the instance client for a one-off call.
- `sdk: { shape: 'function' }` (the default) keeps the per-operation functions.
- `sdk: { name: 'petStore' }` adds an entry point: for `class` it emits a composed root class that instantiates every tag client from one shared config, and for `function` it emits a tree-shakeable `export * as petClient from './pet'`. Setting `name` without a `shape` defaults to `class`.

```ts
pluginFetch({
  sdk: { shape: 'class', name: 'petStore' },
})

const api = new PetStore({ baseURL: 'https://api.example.com' })
await api.petClient.getPetById({ path: { petId: 1 } })
```
