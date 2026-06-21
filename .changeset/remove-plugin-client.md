---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-fetch": minor
---

Remove the `@kubb/plugin-client` package. Its axios and fetch runtimes now ship as the dedicated `@kubb/plugin-axios` and `@kubb/plugin-fetch` packages, which speak the same `RequestResult` contract.

Migrate by swapping the plugin you register:

```ts
// before
import { pluginClient } from '@kubb/plugin-client'
pluginClient({ client: 'axios' })

// after
import { pluginAxios } from '@kubb/plugin-axios'
pluginAxios({})
```

The query plugins (`plugin-react-query`, `plugin-vue-query`, `plugin-swr`) and `plugin-mcp` now read their bundled client runtime from `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of `@kubb/plugin-client`. Register one of those packages, or let the hooks emit their own inline contract client when none is registered.

`plugin-axios` and `plugin-fetch` now export `axiosClientTemplatePath` and `fetchClientTemplatePath` so other plugins can inject the matching runtime.

Three `plugin-client` options have no equivalent and are dropped: `operations` (the `operations.ts` re-export file), `clientType: 'staticClass'`, and `importPath` for a custom client module. Use the `sdk` option on `plugin-axios` / `plugin-fetch` for class-based output.
