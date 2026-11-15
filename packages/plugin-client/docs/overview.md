# Client

The Client plugin turns each OpenAPI operation into a typed function that calls your own client module, with no Fetch, axios, or Kubb runtime dependency.

- Each function takes grouped `path`, `query`, `headers`, `cookies`, and `body` parameters, and passes your client the operation's auth requirements as `security`.
- A call can pass its own `client` to replace the default.
- The query plugins and `@kubb/plugin-mcp` can call the generated functions.
- For a ready-made client, use [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios) instead.

## Setup

- Set the required `importPath` to your client module.
- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- When you set `validator`, add `@kubb/plugin-zod` and install `zod` v4. Generation fails without the plugin.

## Options worth knowing

| Option                | What it does                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `importPath`          | Your client module, resolved from each generated file.                                                  |
| `returnType`          | `'plain'` returns what your `client` returns. `'full'` adds `.unwrap()`. `'data'` resolves to the body. |
| `validator`           | Passes Zod schemas to your client.                                                                      |
| `throwOnErrorDefault` | The `throwOnError` value each call passes. Defaults to `true`.                                          |

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-client/options) for every option. Next, [write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).

## Example

This config groups the functions by tag and points them at `src/client.ts`.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs(),
    pluginClient({
      output: { path: 'clients', mode: 'directory', barrel: { type: 'named' } },
      group: { type: 'tag' },
      // resolved from each generated file: src/gen/clients/<tag>/ to src/client.ts
      importPath: '../../../client',
    }),
  ],
})
```
