# SWR

The SWR plugin generates a `useSWR` hook for each query and a `useSWRMutation` hook for each mutation in your OpenAPI spec, with their cache keys.

- The plugin ships no HTTP client. Each hook calls a function from your client plugin.
- The plugin does not generate `useSWRInfinite` or suspense hooks.

## Example

This config generates hooks that call the Fetch client.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginSwr } from '@kubb/plugin-swr'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs(),
    pluginFetch(),
    pluginSwr(),
  ],
})
```

## Setup

- Add `@kubb/plugin-ts`, or `pluginZod({ inferred: 'codec' })` with `zod` v4 in the app.
- Add one client plugin: `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`. Leave `sdk` unset on it.
- Install `swr` 2.2 or a later v2 release in the app.
- Set the base URL, auth, and validation on the client plugin. With `@kubb/plugin-client`, your client module owns them.

## Options worth knowing

| Option              | What it does                                                                          |
| ------------------- | ------------------------------------------------------------------------------------- |
| `client`            | Picks `'fetch'`, `'axios'`, or `'client'` when several client plugins are registered. |
| `query`, `mutation` | Which HTTP methods become queries and mutations. `false` skips them.                  |

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-swr/options) for every option. Next, [call operations](https://kubb.dev/extensions/kubb-labs/plugin-swr/guides/calling-operations).
