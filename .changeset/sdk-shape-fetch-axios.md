---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Add an `sdk` option to `pluginFetch` and `pluginAxios`, bringing them closer to `pluginClient`.

`sdk` controls the shape of the generated client and an optional aggregation entry point:

- `sdk: { shape: 'class' }` emits one class per tag with a `public static` method per operation, so callers reach an operation as `PetClient.getPetById(...)`. Methods are self-contained, identical to the standalone functions.
- `sdk: { shape: 'function' }` (the default) keeps the per-operation functions.
- `sdk: { name: 'PetStore' }` adds an entry point: for `class` it re-exports every generated class, and for `function` it emits a tree-shakeable `export * as petClient from './pet'`. Setting `name` without a `shape` defaults to `class`.

```ts
pluginFetch({
  sdk: { shape: 'class', name: 'PetStore' },
})
```
