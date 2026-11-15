# Mock API responses

Generate typed MSW handlers and register them in tests or a browser worker.

::steps{level="2"}

## Generate the handlers

Add `pluginTs` and `pluginMsw` to `kubb.config.ts`, then run `kubb generate`. Pick where the response body comes from:

:::tabs

::::tabs-item{label="Your test data"}

The default `parser: 'data'` returns the data you pass.

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

::::

::::tabs-item{label="Faker mock data"}

Add `pluginFaker` and set [`parser`](https://kubb.dev/extensions/kubb-labs/plugin-msw/options#parser) to `'faker'`. A handler called without data then returns generated values when the success response has a schema.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginFaker(),
    pluginMsw({
      output: { path: 'handlers', mode: 'directory' },
      baseURL: 'http://localhost:3000',
      parser: 'faker',
      handlers: true,
    }),
  ],
})
```

See [64-bit integers](EDGE:64-bit-integers).

::::

:::

> [!TIP]
> For Node tests, set `baseURL` to the URL your client calls, so MSW matches absolute requests. In the browser, relative paths match the current origin.

## Register the handlers

With `handlers: true`, `handlers.ts` exports every handler as `handlers`.

:::code-group

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

:::

Call `server.listen()` in your test setup, or `await worker.start()` in your browser entry.

## Supply test data

Call a handler with a response body, or with a callback that returns a `Response`.

```typescript [test-server.ts]
import { setupServer } from 'msw/node'
import { getPetByIdHandler } from './src/gen/handlers/getPetByIdHandler'

export const server = setupServer(
  getPetByIdHandler({ name: 'Rex', photoUrls: [] }),
)
```

::

## Set the base URL at runtime

Kubb sets the `baseURL` option at generation time. When you know the host only at runtime, pass it to `createHandlers`:

```typescript [test-server.ts]
import { setupServer } from 'msw/node'
import { createHandlers } from './src/gen/handlers/handlers'

export const server = setupServer(...createHandlers({ baseURL: getBaseURL() }))
```

Each handler also takes `{ baseURL }` as its second argument. Pass `undefined` as the first argument to keep the default response, for example to mock two services that share a path:

```typescript [test-server.ts]
export const server = setupServer(
  listPetsHandler(undefined, { baseURL: 'https://pets.example.com' }),
  listPetsHandler(undefined, { baseURL: 'https://staging.example.com' }),
)
```

For every handler option, see the [MSW options](https://kubb.dev/extensions/kubb-labs/plugin-msw/options).
