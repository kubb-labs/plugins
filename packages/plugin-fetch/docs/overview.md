# Fetch

Generates one typed async function per OpenAPI operation that sends the request with the native Fetch API and returns a result keyed by status code.

Each function takes grouped `path`, `query`, `headers`, `cookies`, and `body` options. The query plugins and `@kubb/plugin-mcp` call these functions. The runtime is copied into `.kubb/`, so the generated code needs only the global `fetch`.

## Setup

- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- Add `@kubb/plugin-zod` and install `zod` v4 when you set `validator`. Generation fails without the plugin.
- No HTTP client package is needed. The generated code calls the global `fetch`.

## Options worth knowing

| Option                | Set it to                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `baseURL`             | The starting host. The spec's top-level `servers` URL is not used.                         |
| `validator`           | `'zod'` to check response bodies, or `{ request, params, response }` per part.             |
| `throwOnErrorDefault` | `false` to return non-2xx responses as values.                                             |
| `returnType`          | `'data'` to resolve to the success body instead of the full result.                        |
| `sdk`                 | Classes instead of functions. Leave it unset for the query plugins and `@kubb/plugin-mcp`. |

Next, [call operations](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/calling-operations), or see every option and its default in [Options](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options).

## Example

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [pluginTs(), pluginFetch({ baseURL: 'https://petstore.swagger.io/v2' })],
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
