---
"@kubb/plugin-client": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-redoc": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-zod": minor
---

Remove unused `TContext` and `TResolvePathOptions` generics from each plugin's `PluginFactoryOptions` type alias.

Follows the `@kubb/core` cleanup — all plugins previously passed `never, object` for those positions.

**Before**
```ts
type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, object, ResolverZod>
```

**After**
```ts
type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, ResolverZod>
```
