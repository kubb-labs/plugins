# Write your client

The generated functions import your module through [`importPath`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#importpath). That module is the only runtime code the generated functions call, and you own it.

## Required exports

| Export          | Kind     | Purpose                                                                                      |
| --------------- | -------- | -------------------------------------------------------------------------------------------- |
| `client`        | function | Sends the request. Every generated function calls it, unless a call passes its own `client`. |
| `Options`       | type     | The grouped options object a generated function accepts.                                     |
| `RequestResult` | type     | What a generated function resolves to.                                                       |

A generated function calls `client<TResponses, ThrowOnError>(config)`, so type `client` to return `Promise<RequestResult<TResponses, ThrowOnError>>`.

If your spec has server-sent event or JSON Lines operations, `client` also needs a `stream` method, and the module exports the `StreamResult`, `SuccessOf`, `TypedEvent`, and `ServerSentEvent` types. A generated function calls `client.stream<TResponses, ThrowOnError, TItem>(config)` and returns `Promise<StreamResult<TResponses, ThrowOnError, TItem>>`. `TItem` is `TypedEvent<…>` when the document names each event and the success type for JSON Lines. When the document types only the payload, `TItem` is left out and defaults to `ServerSentEvent<SuccessOf<TResponses>>`. A Server-Sent Events call passes `eventShape: 'event'` or `'data'` to say whether `config.validator.response` checks the whole event or its `data`.

The query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`) and `@kubb/plugin-mcp` call the generated functions with `throwOnError: true` and read `data` off the result. The query plugins also import two more types from your module:

| Export                | Kind | Purpose                                                                 |
| --------------------- | ---- | ----------------------------------------------------------------------- |
| `RequestConfig`       | type | The per-call `client` options a hook accepts, minus the request fields. |
| `ResponseErrorConfig` | type | The error type of a failed hook, given the spec's error type.           |

With a relative `importPath`, the hooks resolve it from the generated operation file, so one path serves both.

## Build on the shared runtime

To reuse the runtime of the fetch and axios clients instead of writing your own request pipeline:

1. Copy `core.ts`, `mediaTypes.ts`, `serializers.ts`, `standardSchema.ts`, and `sse.ts` from `@kubb/plugin-client/templates` next to your `client.ts`.
2. In `client.ts`, export the three types the core imports, listed below.
3. Write a `Transport` function that sends a `ResolvedRequest` and returns a web `Response`. If your library does not return one, wrap its bytes in `new Response(bytes, { status, headers })`.
4. Export `createLazyClient((config) => createClientCore({ defaultTransport, ...config }))` as `client`. Register the form and stream media types your spec needs with `client.setConfig({ mediaTypes: { ...formMediaTypes, ...streamMediaTypes } })`, and add `export * from './core.ts'` and `export * from './sse.ts'`.

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
  const { client: apiClient = client, ...config } = options

  return apiClient<GetPetByIdResponses, ThrowOnError>({
    method: 'GET',
    url: '/pet/{petId}',
    security: [{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'oauth2' }],
    ...config,
    throwOnError: config.throwOnError ?? true,
  })
}
```

Your `client` receives `method`, the `url` template with `{param}` placeholders, `security`, the grouped `path`, `query`, `headers`, `cookies`, and `body`, and `throwOnError`. It returns a promise. `cookies` holds name and value pairs, which your client joins into a `Cookie` header, as the example below does. A `security` entry is one scheme, or an array of schemes to send together.

Read the body by the response `Content-Type`. An operation with only binary success content also passes `parseAs: 'blob'`.

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
  parseAs?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
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

async function send(config: RequestConfig) {
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

// Generated functions pass their responses type and `ThrowOnError`.
export const client = <TResponses, ThrowOnError extends boolean = true>(config: RequestConfig) =>
  send(config) as Promise<RequestResult<TResponses, ThrowOnError>>
```

The [example project](https://github.com/kubb-labs/plugins/tree/main/examples/client) has a fuller version with a base URL setter, query handling, and an async auth hook. The types in this sketch are minimal. Add status-aware response types when you need them.

> [!TIP]
> Kubb does not depend on retries, interceptors, or request signing. Add them to `client` when you need them.
