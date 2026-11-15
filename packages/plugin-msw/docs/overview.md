# MSW

The MSW plugin generates a typed MSW request handler for each operation in your OpenAPI spec. Each handler returns the data you pass to it. With `parser: 'faker'`, a handler called without data returns mock data from `@kubb/plugin-faker`. Only operations with a success response schema get mock data.

## Setup

- Add `@kubb/plugin-ts` for the request and response types.
- Add `@kubb/plugin-faker` when you set `parser: 'faker'`, and install `@faker-js/faker` v10. The default `'data'` parser does not need it.
- Install `msw` v3 in the app that uses the generated code.

## Options worth knowing

| Option                                                                          | Default  | What it does                                                                                                  |
| ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| [`parser`](https://kubb.dev/extensions/kubb-labs/plugin-msw/options#parser)     | `'data'` | Where the response body comes from: the data you pass, or Faker.                                              |
| [`handlers`](https://kubb.dev/extensions/kubb-labs/plugin-msw/options#handlers) | `false`  | Writes a `handlers.ts` that exports every handler, plus `createHandlers({ baseURL })` for a runtime base URL. |
| [`baseURL`](https://kubb.dev/extensions/kubb-labs/plugin-msw/options#baseurl)   | None     | Prepends a host to the path each handler matches.                                                             |

## Example

The config below generates one handler per operation and a `handlers.ts` that exports them all. For `GET /pets/{petId}`, the plugin writes `showPetByIdHandler.ts`:

::code-group

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

```typescript [src/gen/handlers/showPetByIdHandler.ts]
import type { ShowPetByIdResponse } from '../types/ShowPetById'
import { http, HttpResponse } from 'msw/http'

export function showPetByIdHandlerResponse200(data?: ShowPetByIdResponse) {
  return new HttpResponse<string>(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function showPetByIdHandler(
  data?: ShowPetByIdResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
  options?: { baseURL?: string },
) {
  return http.get(`${options?.baseURL ?? ''}/pets/:petId`, function handler(info) {
    if (typeof data === 'function') return data(info)

    return showPetByIdHandlerResponse200(data)
  })
}
```

::

The [Mock API responses](https://kubb.dev/extensions/kubb-labs/plugin-msw/guides/mock-api) guide shows how to register the handlers in tests and the browser.
