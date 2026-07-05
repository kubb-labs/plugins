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

Move each plugin resolver onto the new `@kubb/core` resolver API.

The `default(name, type)` discriminator every resolver exported is gone. The built-in machinery now lives under `resolver.default`: `default.name` (the identifier casing primitive), `default.file` (the `FileNode` builder), plus `default.options`, `default.path`, `default.banner`, and `default.footer`. Generators call two injected top-level helpers, `resolver.name(name)` and `resolver.file(params, context)`, that delegate to `resolver.default.*` unless a plugin overrides them.

```ts
// before
resolverZod.default('list pets', 'function') // 'listPetsSchema'
resolverTs.core.file({ name, extname: '.ts' }, context)
// after
resolverZod.name('list pets')                // 'listPetsSchema'
resolverTs.file({ name, extname: '.ts' }, context)
```

Each plugin's composite naming methods are grouped into namespaces and drop the `resolve*Name` prefix. Inside a namespace method `this` is the resolver root, so `this.name(...)` reaches the top-level caser.

| Before | After |
| --- | --- |
| `resolver.resolveTypeName` | `resolver.name` |
| `resolver.resolveResponseStatusName` | `resolver.response.status` |
| `resolver.resolveResponsesName` | `resolver.response.responses` |
| `resolver.resolveBodyName` | `resolver.response.body` |
| `resolver.resolvePathName` / `resolveQueryName` / `resolveHeadersName` | `resolver.param.path` / `query` / `headers` |
| `resolver.resolveQueryName` (react/vue/swr) | `resolver.query.name` |
| `resolver.resolveClassName` | `resolver.className` |

File-name casing rides on the `file` params. Pass `resolveName` to change how the base name is cased, as in `this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)`. A custom resolver overrides the top-level `name`/`file` directly, with no `default:` block, and merges with `mergeResolver`, so a partial override keeps every other built-in helper.
