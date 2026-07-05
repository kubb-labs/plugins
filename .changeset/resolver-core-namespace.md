---
'@kubb/plugin-ts': minor
'@kubb/plugin-zod': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-cypress': minor
'@kubb/plugin-msw': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Move each plugin resolver onto the new `@kubb/core` `resolver.core` API.

The `default(name, type)` discriminator each resolver exported is replaced by dedicated helpers under `core`: `core.name` (the generated identifier casing) and `core.fileName` (file paths). The shared `resolveOptions`/`resolvePath`/`resolveFile`/`resolveBanner`/`resolveFooter` become `core.options`/`core.path`/`core.file`/`core.banner`/`core.footer`. Each plugin's own naming methods (`resolveName`, `resolveTypeName`, `resolveQueryName`, `resolveSchemaTypeName`, ...) keep their names and now delegate through `this.core`.

```ts
// before
resolverZod.default('list pets', 'function') // 'listPetsSchema'
// after
resolverZod.core.name('list pets')            // 'listPetsSchema'
```

A plugin's `resolver` option now accepts a deep partial, so an override can name a single helper — `resolver: { core: { name } }` or a single `resolveName` — without restating the rest. Overrides merge with `mergeResolver`, so a partial `core` keeps the other built-in helpers.
