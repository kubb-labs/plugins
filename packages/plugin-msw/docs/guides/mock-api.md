# Mock API responses

Configure generated MSW handlers and register them in tests or a browser worker.

## Generate typed handlers

Add `pluginTs` and `pluginMsw` to your configuration. The default `parser: 'data'` creates handlers whose response data you supply.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginMsw } from '@kubb/plugin-msw'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginMsw({ output: { path: 'handlers', mode: 'directory' }, baseURL: 'http://localhost:3000', handlers: true }),
  ],
})
```

> [!TIP]
> For Node tests, set `baseURL` to the URL your client calls so MSW can match absolute requests. Browser handlers can use relative paths for the current origin.

## Supply test data

Call a generated handler with a response body or a callback that returns a `Response`.

```typescript [test-server.ts]
import { setupServer } from 'msw/node'
import { getPetByIdHandler } from './src/gen/handlers/getPetByIdHandler'

export const server = setupServer(
  getPetByIdHandler({ name: 'Rex', photoUrls: [] }),
)
```

## Generate mock data

Add `pluginFaker` and change the MSW [`parser`](https://kubb.dev/extensions/kubb-labs/plugin-msw/options#parser) to `'faker'`.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'

const plugins = [
  pluginTs(),
  pluginFaker(),
  pluginMsw({
    output: { path: 'handlers', mode: 'directory' },
    baseURL: 'http://localhost:3000',
    parser: 'faker',
    handlers: true,
  }),
]
```

Use this array as `defineConfig.plugins`. Calling `getPetByIdHandler()` without data now uses generated Faker values.

## Register the handler collection

With `handlers: true`, `handlers.ts` exports a `handlers` array with every handler in operation order. Register it in Node or a browser.

::code-group

```typescript [test-server.ts]
import { setupServer } from 'msw/node'
import { handlers } from './src/gen/handlers/handlers'

export const server = setupServer(...handlers)
```

```typescript [browser-worker.ts]
import { setupWorker } from 'msw/browser'
import { handlers } from './src/gen/handlers/handlers'

export const worker = setupWorker(...handlers)
```

::

Call `server.listen()` in your test setup, or `await worker.start()` in your browser entry.

## Set the base URL at runtime

The `baseURL` option is fixed when Kubb generates the handlers. When the host is only known at runtime, such as from your API client's config, call `createHandlers` with it:

```typescript [test-server.ts]
import { setupServer } from 'msw/node'
import { createHandlers } from './src/gen/handlers/handlers'

export const server = setupServer(...createHandlers({ baseURL: getBaseURL() }))
```

Each handler also takes `{ baseURL }` as its second argument, which overrides the configured one for that handler. Pass `undefined` as the first argument to keep the default response. This lets you mock two services that share a path:

```typescript [test-server.ts]
export const server = setupServer(
  listPetsHandler(undefined, { baseURL: 'https://pets.example.com' }),
  listPetsHandler(undefined, { baseURL: 'https://staging.example.com' }),
)
```
