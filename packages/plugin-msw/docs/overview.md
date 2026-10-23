# MSW

The MSW plugin generates a typed MSW request handler for each operation in your OpenAPI spec.

Each handler returns the data you pass to it. With `parser: 'faker'`, a handler called without data returns mock data from `@kubb/plugin-faker`. Only operations with a success response schema get mock data.

## Setup

- Add `@kubb/plugin-ts` for the request and response types.
- Add `@kubb/plugin-faker` when you set `parser: 'faker'`, and install `@faker-js/faker` v10. The default `data` parser does not need it.
- Install `msw` v2 in the app that uses the generated code.

## Options worth knowing

- `parser` sets where the response body comes from: `data` (default) or `faker`.
- `handlers` writes a `handlers.ts` file that exports every handler, ready to spread into `setupServer` or `setupWorker`, plus `createHandlers({ baseURL })` to set the base URL at runtime.
- `baseURL` is prepended to the path each handler matches.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-msw/options) for every option and its default.

## Example

The config below generates one handler per operation and a `handlers.ts` file that exports them all.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginMsw } from '@kubb/plugin-msw'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginMsw({ output: { path: 'handlers', mode: 'directory' }, handlers: true }),
  ],
})
```
