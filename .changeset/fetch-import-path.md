---
'@kubb/plugin-fetch': minor
---

Add an `importPath` option, so the generated operations import `client` and its types from a module of your own instead of `.kubb/client.ts`.

- The plugin still copies its runtime to `.kubb/`, so the module can re-export it and replace only `client`.
- Unset, the output is unchanged. The class-based `sdk` keeps importing `.kubb/client.ts`.

```ts
pluginFetch({ importPath: '../client' })
```

```ts
// src/gen/client.ts
import { client as runtimeClient } from './.kubb/client'

export * from './.kubb/client'

export const client = runtimeClient.createClient({ headers: { 'x-app': 'web' } })
```
