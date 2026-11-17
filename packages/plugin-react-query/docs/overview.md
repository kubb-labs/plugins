# React Query

The React Query plugin generates TanStack Query `queryOptions` and `mutationOptions` factories with cache keys from your OpenAPI spec, plus optional hooks.

- `hooks: true` adds `useQuery` and `useMutation` hooks, with suspense and infinite variants on request.
- The plugin ships no HTTP client. Each helper calls a function from your client plugin.

## Setup

- Add `@kubb/plugin-ts`, or `pluginZod({ inferred: 'codec' })` with `zod` v4 in the app.
- Add one client plugin: `@kubb/plugin-fetch`, `@kubb/plugin-axios`, `@kubb/plugin-ky`, or `@kubb/plugin-client`. Leave `sdk` unset on it.
- Install `@tanstack/react-query` 5.82 or a later v5 release in the app.
- Set the base URL, auth, and validation on the client plugin. With `@kubb/plugin-client`, your client module owns them.

## Options worth knowing

| Option              | What it does                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `client`            | Picks `'fetch'`, `'axios'`, `'ky'`, or `'client'` when several client plugins are registered.    |
| `hooks`             | Adds the `use*` hooks. `infinite`, `suspense`, and `customOptions` need it.                      |
| `query`, `mutation` | Which HTTP methods become queries and mutations. `false` skips them.                             |
| `infinite`          | Adds infinite queries to operations with the `infinite.queryParam` parameter, `'id'` by default. |
| `suspense`          | `{}` adds `useSuspenseQuery` hooks.                                                              |
| `customOptions`     | Routes every hook through your function for shared options.                                      |

## Example

This config generates hooks that call the Fetch client.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs(),
    pluginFetch(),
    pluginReactQuery({ hooks: true }),
  ],
})
```

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options) for every option. Next, [call operations](https://kubb.dev/extensions/kubb-labs/plugin-react-query/guides/calling-operations).
