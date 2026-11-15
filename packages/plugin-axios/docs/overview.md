# Axios

Generates one typed async function per OpenAPI operation that sends the request with axios. Each function takes grouped `path`, `query`, `headers`, `cookies`, and `body` options and returns a result keyed by status code.

The query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`) and `@kubb/plugin-mcp` call these functions. The plugin also copies its runtime into `.kubb/` in the root output folder, so the generated code imports only `axios`.

## Setup

- Add `@kubb/plugin-ts` for the operation types, or `@kubb/plugin-zod` with `inferred: true`.
- Add `@kubb/plugin-zod` and install `zod` v4 when you set `validator`. Generation fails without the plugin.
- Install `axios` 1.20 or a later 1.x release in the app that runs the generated code.

## Options worth knowing

| Option                | Set it to                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `baseURL`             | Give the client a starting host. The spec's top-level `servers` URL is not used.                    |
| `validator`           | `'zod'` to check response bodies, or `{ request, params, response }` to check each part.            |
| `throwOnErrorDefault` | `false` to return non-2xx responses as values. A call can still pass `throwOnError`.                |
| `returnType`          | `'data'` to resolve to the success body instead of the full result.                                 |
| `sdk`                 | Generate classes instead of functions. Leave it unset for the query plugins and `@kubb/plugin-mcp`. |

[Options](https://kubb.dev/extensions/kubb-labs/plugin-axios/options) lists every option and its default.

## Example

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [pluginTs(), pluginAxios({ baseURL: 'https://petstore.swagger.io/v2' })],
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

The config sets [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), so an `int64` id such as `petId` is a `number`. With the default `bigint`, the call takes `1n`.
