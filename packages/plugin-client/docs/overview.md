# Client

The Client plugin turns each operation in your OpenAPI spec into a typed function that calls a client module you write. The generated code has no Fetch, axios, or Kubb runtime dependency.

Each function takes grouped `path`, `query`, `headers`, `cookies`, and `body` parameters and passes the operation's auth requirements to your client as `security`. A call can pass its own `client` to replace the default. For a ready-made client, use [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios). The query plugins and `@kubb/plugin-mcp` can call the generated functions too.

## Setup

- Set the required `importPath` to your client module. [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client) lists what the module must export.
- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- When you set `validator`, add `@kubb/plugin-zod` and install `zod` v4. Generation fails without the plugin.

## Options worth knowing

| Option                | What it does                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `importPath`          | Written into every generated import as given, so it must resolve from the generated file.                          |
| `returnType`          | `'plain'` returns what your `client` returns. `'full'` adds `.unwrap()`, and `'data'` resolves to the body.        |
| `validator`           | `'zod'` passes response schemas to your client. `{ request: 'zod', response: 'zod' }` also passes request schemas. |
| `throwOnErrorDefault` | The `throwOnError` value each call passes to your client. The default is `true`.                                   |

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-client/options) for every option and its default.

## Example

The config below groups the generated functions by tag and points them at the client module in `src/client.ts`.

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
