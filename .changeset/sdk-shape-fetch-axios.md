---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Add an `sdk` option to `pluginFetch` and `pluginAxios` that generates a class-based SDK. Leave `sdk` unset to keep the standalone per-operation functions, which is the default and what query plugins consume.

Each tag client is an instance class whose constructor takes a client config and builds its own client, so every environment is a separate instance. A per-call `client` option still overrides the instance client for a one-off call.

- `sdk: {}` emits one class per tag.
- `sdk: { name: 'petStore' }` adds a composed root class that instantiates every tag client from one shared config, exposed under each tag.
- `sdk: { name: 'petStore', mode: 'single' }` collapses everything into one flat class named by `name`, with every operation as a direct method. The default `mode: 'tag'` keeps the per-tag classes.

```ts
pluginFetch({
  sdk: { name: 'petStore' },
})

const api = new PetStore({ baseURL: 'https://api.example.com' })
await api.pet.getPetById({ path: { petId: 1 } })
```

```ts
pluginFetch({
  sdk: { name: 'petStore', mode: 'single' },
})

const api = new PetStore({ baseURL: 'https://api.example.com' })
await api.getPetById({ path: { petId: 1 } })
```
