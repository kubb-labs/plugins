# Write your client

The generated functions import your module through [`importPath`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#importpath). That module is the only runtime code the generated functions call, and you own it.

## Required exports

| Export          | Kind     | Purpose                                                                                      |
| --------------- | -------- | -------------------------------------------------------------------------------------------- |
| `client`        | function | Sends the request. Every generated function calls it, unless a call passes its own `client`. |
| `Options`       | type     | The grouped options object a generated function accepts.                                     |
| `RequestResult` | type     | What a generated function resolves to.                                                       |

If your spec has server-sent event operations, also export `toEventStream` and the `EventStreamResult`, `SuccessOf`, `TypedEvent`, and `ServerSentEvent` types. A generated function calls `toEventStream<TEvent>(promise)` with the promise your `client` returns and nothing else, and returns `EventStreamResult<TEvent>`. `TEvent` is `TypedEvent<…>` when the document names each event, and `ServerSentEvent<…>` when it types only the payload. The function leaves the response validator on `config.validator.response`, so your module decides how to validate events. A JSON Lines operation calls `toEventStream<TItem>(promise, { shape: 'line' })` instead, so your `toEventStream` must read the body one JSON item per line when `shape` is `'line'`.

The query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`) and `@kubb/plugin-mcp` call the generated functions with `throwOnError: true` and read `data` off the result. The query plugins also import two more types from your module:

| Export                | Kind | Purpose                                                                 |
| --------------------- | ---- | ----------------------------------------------------------------------- |
| `RequestConfig`       | type | The per-call `client` options a hook accepts, minus the request fields. |
| `ResponseErrorConfig` | type | The error type of a failed hook, given the spec's error type.           |

With a relative `importPath`, the hooks resolve it from the generated operation file, so one path serves both.

## Build on the shared runtime

To reuse the runtime of the fetch and axios clients instead of writing your own request pipeline:

1. Copy `core.ts`, `serializers.ts`, `standardSchema.ts`, and `sse.ts` from `@kubb/plugin-client/templates` next to your `client.ts`.
2. In `client.ts`, export the three types the core imports, listed below.
3. Write a `Transport` function that sends a `ResolvedRequest`. It can return a web `Response`, which the core parses for you, or a `TransportResult` when your library does not return one.
4. Export `createClientCore({ defaultTransport })` as `client`, and add `export * from './core.ts'` and `export * from './sse.ts'`.

| Export           | Purpose                                                 | On fetch      | On axios             |
| ---------------- | ------------------------------------------------------- | ------------- | -------------------- |
| `NativeRequest`  | The request object on a result and a `ResponseError`.   | `Request`     | `AxiosRequestConfig` |
| `NativeResponse` | The response object on a result and a `ResponseError`.  | `Response`    | `AxiosResponse`      |
| `NativeOptions`  | The `options` a call passes to your HTTP library as is. | `RequestInit` | `AxiosRequestConfig` |

[`@kubb/plugin-fetch/templates/client.ts`](https://github.com/kubb-labs/plugins/blob/main/packages/plugin-fetch/templates/client.ts) is a complete example.

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

Your `client` receives `method`, the `url` template with `{param}` placeholders, `security`, the grouped `path`, `query`, `headers`, `cookies`, and `body`, and `throwOnError`. It returns a promise. `cookies` holds name and value pairs, which your client joins into a `Cookie` header, as the example below does.

A non-JSON response also passes `responseType`. It is a string such as `'blob'` when every response content type uses one parser, or a map from content type to parser when they differ, for example `{ 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }`. Read the response `Content-Type`, look it up in the map (exact type, then `type/*`, then `*/*`), and parse the body with that parser.

A call can also pass `contentType`: `request` is the body's media type, and `response` is the media type to ask for in `Accept`. A streamed operation always passes its media type, such as `contentType: { response: 'text/event-stream' }` or `contentType: { response: 'application/jsonl' }`. A call whose response offers `text/event-stream` next to another content type passes `text/event-stream` too, unless the caller picks another one. `RequestConfig` needs the field.

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
  cookies?: object
  body?: unknown
  signal?: AbortSignal
  responseType?: string | Record<string, string>
  contentType?: string | { request?: string; response?: string }
  throwOnError?: boolean
  security?: Array<{ type: string; name?: string; in?: string; scopes?: Array<string> }>
  client?: typeof client
}

type DataShape = { body?: unknown; cookies?: unknown; headers?: unknown; path?: unknown; query?: unknown }

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
  const cookie = Object.entries(config.cookies ?? {})
    .filter(([, value]) => value != null)
    .map(([name, value]) => `${name}=${encodeURIComponent(String(value))}`)
    .join('; ')

  const response = await fetch(url, {
    method: config.method,
    headers: {
      ...(config.headers as Record<string, string>),
      ...(cookie ? { Cookie: cookie } : {}),
    },
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
