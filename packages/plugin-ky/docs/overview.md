# Ky

Generates one typed async function per OpenAPI operation that sends the request with [Ky](https://github.com/sindresorhus/ky) and returns a result keyed by status code.

Each function takes grouped `path`, `query`, `headers`, `cookies`, and `body` options, plus Ky options such as `retry`, `timeout`, and `hooks`. The query plugins and `@kubb/plugin-mcp` call these functions. The runtime is copied into `.kubb/`, so the generated code imports only `ky`.

## Setup

- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- Add `@kubb/plugin-zod` and install `zod` v4 when you set `validator`. Generation fails without the plugin.
- Install `ky` 2.0 or a later 2.x release in the app that runs the generated code.

## Options worth knowing

| Option                | Set it to                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `baseURL`             | The starting host. The spec's top-level `servers` URL is not used.                         |
| `validator`           | `'zod'` to check response bodies, or `{ request, params, response }` per part.             |
| `throwOnErrorDefault` | `false` to return non-2xx responses as values.                                             |
| `returnType`          | `'data'` to resolve to the success body instead of the full result.                        |
| `sdk`                 | Classes instead of functions. Leave it unset for the query plugins and `@kubb/plugin-mcp`. |

Next, [call operations](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/calling-operations), or see every option and its default in [Options](https://kubb.dev/extensions/kubb-labs/plugin-ky/options).

## Example

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginKy } from '@kubb/plugin-ky'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [pluginTs(), pluginKy({ baseURL: 'https://petstore.swagger.io/v2' })],
})
```

```typescript [src/app.ts]
import { getPetById } from './gen/clients/getPetById'

const { data } = await getPetById({ path: { petId: 1 } })
```

```text [Generated files]
src/gen/
├── .kubb/          # the runtime: client.ts, core.ts, config.ts, serializers/, ...
├── clients/
│   ├── getPetById.ts
│   └── index.ts
└── types/
```

::

With [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), an `int64` id such as `petId` is a `number`. With the default `bigint`, pass `1n`.
