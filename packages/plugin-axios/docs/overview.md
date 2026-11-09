# Axios

The Axios plugin turns each operation in your OpenAPI spec into a typed async function that sends the request with axios. Each function takes grouped `path`, `query`, `headers`, and `body` parameters and returns a result keyed by status code.

The query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, and `@kubb/plugin-swr`) and `@kubb/plugin-mcp` call these functions. The plugin also copies its runtime files (`client.ts`, `serializers.ts`, and `standardSchema.ts`) to `.kubb/` in the root output folder.

## Setup

- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- Add `@kubb/plugin-zod` when you set `validator`, and install `zod` v4. Without the plugin, `validator` does nothing.
- Install `axios` 1.20 or a later v1 release in the app that uses the generated code.

## Options worth knowing

- `baseURL` is prepended to every request. The spec's top-level `servers` URL is not used, so without `baseURL` you set one at runtime with `client.setConfig({ baseURL })`. Operations with their own `servers`, on the path or the operation, call that URL instead.
- `validator: 'zod'` validates response bodies with the schemas from `@kubb/plugin-zod`. Use `{ request: 'zod', response: 'zod' }` to also validate request bodies.
- `throwOnErrorDefault: false` returns non-2xx responses as values instead of throwing. A single call can still pass `throwOnError`.
- `returnType: 'data'` makes a call resolve to the success body instead of the full result. With `throwOnError: false`, the call still returns the full result.
- `sdk` generates a class-based SDK, grouped by tag or flat, instead of standalone functions. The query plugins and `@kubb/plugin-mcp` need the standalone functions, so leave `sdk` unset when you use them.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-axios/options) for every option and its default.

## Example

The config below generates an axios client that sends every request to the Petstore API.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginAxios({ baseURL: 'https://petstore.swagger.io/v2' }),
  ],
})
```
