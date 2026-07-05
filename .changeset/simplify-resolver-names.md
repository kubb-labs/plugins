---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
---

Simplify the resolver naming API so the request-part resolvers line up with the generated object keys, and drop the redundant `resolvePathName`.

`resolvePathName(name, type)` duplicated `default(name, type)` on every resolver, so it is removed. Call `default` directly where you previously called `resolvePathName`:

```ts
// before
resolver.resolveFile({ name: resolver.resolvePathName(name, 'file'), extname: '.ts' }, context)

// after
resolver.resolveFile({ name: resolver.default(name, 'file'), extname: '.ts' }, context)
```

The request-part resolvers now use the same `body` / `path` / `query` / `headers` vocabulary as the generated `RequestConfig` object:

| Before | After |
| --- | --- |
| `resolveDataName` | `resolveBodyName` |
| `resolvePathParamsName` | `resolvePathName` |
| `resolveQueryParamsName` | `resolveQueryName` |
| `resolveHeaderParamsName` | `resolveHeadersName` |

The request body type also drops its `Data` suffix in favor of `Body`, so generated names change: `CreatePetData` becomes `CreatePetBody`, and the Zod schema `createPetDataSchema` becomes `createPetBodySchema`. Custom resolvers that override these methods, and code that imports the generated names, need updating.

Note that `resolvePathName` is reused: the old file-name method of that name is gone, and it now names the grouped path-parameters resolver `resolvePathName(node, param)`.
