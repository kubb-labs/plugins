# Client

The Client plugin turns each operation in your OpenAPI spec into a typed function that calls a client module you write. The generated code has no Fetch, axios, or Kubb runtime dependency.

Each function takes grouped `path`, `query`, `headers`, and `body` parameters and passes the operation's auth requirements to your client in a `security` list. A single call can pass its own `client` to replace the default. For a ready-made client, use `@kubb/plugin-fetch` or `@kubb/plugin-axios` instead. The query plugins and `@kubb/plugin-mcp` work with this plugin too. Their hooks and handlers then call your client module.

## Setup

- Set the required `importPath` option to your client module. The module must export `client` and the `Options` and `RequestResult` types. When the spec has server-sent event operations, it must also export `toEventStream` and the `EventStreamResult` and `SuccessOf` types.
- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- Add `@kubb/plugin-zod` when you set `validator`, and install `zod` v4. Generation fails without the plugin.

## Options worth knowing

- `importPath` is written into every generated import as given, so it must resolve from the generated file. A relative path, a package name, or an alias works.
- `validator: 'zod'` passes response schemas from `@kubb/plugin-zod` to your client. Use `{ request: 'zod', response: 'zod' }` to also pass request body schemas.
- `throwOnErrorDefault` is the `throwOnError` value each call passes to your client. The default is `true`.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-client/options) for every option and its default.

## Example

The config below groups the generated functions by tag and points them at the client module in `src/client.ts`.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
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
