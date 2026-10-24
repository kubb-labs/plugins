# Write your client

The generated functions import your module through [`importPath`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#importpath). That module is the only runtime code the generated functions call, and you own it.

## Required exports

| Export          | Kind     | Purpose                                                                                      |
| --------------- | -------- | -------------------------------------------------------------------------------------------- |
| `client`        | function | Sends the request. Every generated function calls it, unless a call passes its own `client`. |
| `Options`       | type     | The grouped options object a generated function accepts.                                     |
| `RequestResult` | type     | What a generated function resolves to.                                                       |

If your spec has server-sent event operations, also export `toEventStream` and the `EventStreamResult` and `SuccessOf` types.

The query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`) and `@kubb/plugin-mcp` call the generated functions with `throwOnError: true` and read `data` off the result. The query plugins also import two more types from your module:

| Export                | Kind | Purpose                                                                 |
| --------------------- | ---- | ----------------------------------------------------------------------- |
| `RequestConfig`       | type | The per-call `client` options a hook accepts, minus the request fields. |
| `ResponseErrorConfig` | type | The error type of a failed hook, given the spec's error type.           |

With a relative `importPath`, the hooks resolve it from the generated operation file, so one path serves both.

## What a generated function looks like

```typescript
import type { Options, RequestResult } from '../../../client'
import type { GetPetByIdOptions, GetPetByIdResponses } from '../../models/pet/GetPetById'
import { client } from '../../../client'

export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/{petId}',
    security: [{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'oauth2' }],
    ...config,
    throwOnError: config.throwOnError ?? true,
  }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
```

Your `client` receives `method`, the `url` template with `{param}` placeholders, `security`, the grouped `path`, `query`, `headers`, and `body`, and `throwOnError`. It returns a promise.

## A minimal client

The client below uses `fetch`. Replace the transport with the HTTP library you use.

```typescript [src/client.ts]
export type RequestConfig = {
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  url: string
  baseURL?: string
  headers?: object
  path?: object
  query?: object
  body?: unknown
  signal?: AbortSignal
  throwOnError?: boolean
  security?: Array<{ type: string; name?: string; in?: string; scopes?: Array<string> }>
  client?: typeof client
}

type DataShape = { body?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type Options<TData extends DataShape, ThrowOnError extends boolean = true> = Omit<RequestConfig, keyof DataShape | 'url' | 'method'> &
  TData & { throwOnError?: ThrowOnError }

export type RequestResult<TResponses, ThrowOnError extends boolean = true> = ThrowOnError extends true
  ? { data: TResponses[keyof TResponses]; error: undefined; response: Response }
  : { data: TResponses[keyof TResponses]; error: undefined; response: Response } | { data: undefined; error: {}; response: Response }

// Only needed by the query plugins: what a failed hook rejects with.
export type ResponseErrorConfig<TError = unknown> = Error & { body?: TError }

// Set this to your API host. `new URL()` needs an absolute URL.
export const settings = { baseURL: 'https://petstore3.swagger.io/api/v3' }

export async function client(config: RequestConfig) {
  const path: Record<string, unknown> = { ...config.path }
  const url = new URL((config.baseURL ?? settings.baseURL) + config.url.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(path[key]))))

  const response = await fetch(url, {
    method: config.method,
    headers: config.headers as Record<string, string>,
    body: config.body === undefined ? undefined : JSON.stringify(config.body),
    signal: config.signal,
  })
  const body = await response.json().catch(() => undefined)

  if (response.ok) return { data: body, error: undefined, response }
  if (config.throwOnError ?? true) throw new Error(`Request failed with status ${response.status}`)
  return { data: undefined, error: body ?? { status: response.status }, response }
}
```

The [example project](https://github.com/kubb-labs/plugins/tree/main/examples/client) has a fuller version with a base URL setter, query handling, and an async auth hook. The types in this sketch are minimal. Add status-aware response types when you need them.

> [!TIP]
> Kubb does not depend on retries, interceptors, or request signing. Add them to `client` when you need them.
