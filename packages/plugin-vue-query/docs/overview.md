# Vue Query

The Vue Query plugin generates TanStack Query `queryOptions` factories, query and mutation keys, and optional composables from your OpenAPI spec.

- `hooks: true` adds `useQuery` and `useMutation` composables that take reactive parameters, with infinite variants on request.
- The plugin ships no HTTP client. Each helper calls a function from your client plugin.

## Setup

- Add `@kubb/plugin-ts`, or `pluginZod({ inferred: 'codec' })` with `zod` v4 in the app.
- Add one client plugin: `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`. Leave `sdk` unset on it.
- Install `@tanstack/vue-query` 5.41 or a later v5 release and `vue` 3.3 or later in the app.
- Set the base URL, auth, and validation on the client plugin. With `@kubb/plugin-client`, your client module owns them.

## Options worth knowing

| Option              | What it does                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `client`            | Picks `'fetch'`, `'axios'`, or `'client'` when several client plugins are registered.            |
| `hooks`             | Adds the `use*` composables. `infinite` needs it.                                                |
| `query`, `mutation` | Which HTTP methods become queries and mutations. `false` skips them.                             |
| `infinite`          | Adds infinite queries to operations with the `infinite.queryParam` parameter, `'id'` by default. |

## Example

This config generates composables that call the Fetch client.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginVueQuery } from '@kubb/plugin-vue-query'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs(),
    pluginFetch(),
    pluginVueQuery({ hooks: true }),
  ],
})
```

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options) for every option. Next, [call operations](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/guides/calling-operations).
