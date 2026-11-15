# Write your client

Build the client module that every generated function imports through `importPath`. You own its transport, auth, and error handling.

::steps{level="2"}

## Check the contract

Export the names the generated files import:

| Export                                                   | Needed when                                      |
| -------------------------------------------------------- | ------------------------------------------------ |
| `client` function, `Options` type                        | Always.                                          |
| `RequestResult` type                                     | `returnType` is `'plain'` (default) or `'full'`. |
| `withUnwrap`, `resolveThrowOnError`, `Unwrappable`       | `returnType: 'full'`.                            |
| `unwrapResult`, `resolveThrowOnError`, `UnwrappedResult` | `returnType: 'data'`.                            |
| `toHeadersStandardSchema` function                       | `validator: { params: 'zod' }`.                  |
| `RequestConfig`, `ResponseErrorConfig` types             | A query plugin calls the generated functions.    |

A generated function calls `client<TResponses, ThrowOnError>(config)`, which must return `Promise<RequestResult<TResponses, ThrowOnError>>`.

> [!NOTE]
> The query plugins and `@kubb/plugin-mcp` call with `throwOnError: true` and read `data` off the result, so `RequestResult` needs a `data` field.

Declare each `config` field your spec produces on `RequestConfig`, or the generated files fail to compile:

| Field                                         | Passed when                                                            | Value                                                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `method`, `url`, `throwOnError`               | Always                                                                 | The upper-case method, the path template such as `'/pet/{petId}'`, and the caller's `throwOnError` or the default.                 |
| `path`, `query`, `headers`, `cookies`, `body` | The caller passes them                                                 | Typed from the spec. `cookies` holds name and value pairs.                                                                         |
| `baseURL`                                     | The path or operation declares its own `servers`                       | That server's URL. Use it when set.                                                                                                |
| `security`                                    | The operation has security requirements                                | See [Authenticate](#authenticate).                                                                                                 |
| `styles`                                      | A parameter sets `style`, `explode`, `allowReserved`, or `contentType` | See [Serialize parameters](#serialize-parameters).                                                                                 |
| `contentType`                                 | The operation has a body or streams                                    | `request` is the body's media type, `response` the `Accept` value.                                                                 |
| `parseAs`                                     | Every success content type is binary                                   | `'blob'`                                                                                                                           |
| `validator`                                   | The `validator` option is set                                          | See [Validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses). |

A spec with Server-Sent Events or JSON Lines operations needs `client.stream` and more exports and fields. See [Stream Server-Sent Events and JSON Lines](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/streaming).

Other keys the caller passes, such as `signal`, arrive through `...config`. A generated function looks like this:

```typescript [src/gen/clients/pet/getPetById.ts]
import type { Options, RequestResult } from '../../../client'
import type { GetPetByIdOptions, GetPetByIdResponses } from '../../types/GetPetById'
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

## Write the client

Write the module from scratch, or build it on the runtime that `@kubb/plugin-fetch` and `@kubb/plugin-axios` use.

:::tabs

::::tabs-item{label="From scratch"}

This client uses `fetch` and reads JSON. Replace `send` with your HTTP library.

```typescript [src/client.ts]
export type Auth = {
  type: string
  scheme?: string
  name?: string
  in?: string
  scopes?: Array<string>
  flows?: Record<string, Record<string, string>>
  metadataUrl?: string
  url?: string
}

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
  security?: Array<Auth | Array<Auth>>
  styles?: object
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
  // The default `form` style repeats the key for each array item and sends each object property as its own parameter. Other styles: see Serialize parameters.
  for (const [key, value] of Object.entries(config.query ?? {})) {
    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
    for (const [name, entry] of isObject ? Object.entries(value) : [[key, value]]) {
      for (const item of Array.isArray(entry) ? entry : [entry]) {
        if (item !== undefined) url.searchParams.append(name, String(item))
      }
    }
  }
  const cookie = Object.entries(config.cookies ?? {})
    .filter(([, value]) => value != null)
    .map(([name, value]) => `${name}=${encodeURIComponent(String(value))}`)
    .join('; ')
  // `Headers` matches names in any case, so a caller's `content-type` or `authorization` still wins.
  const headers = new Headers(config.headers as Record<string, string>)
  if (config.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  // On the server this adds to the caller's cookies. Browsers drop a script-set `Cookie` header and send their own.
  if (cookie) headers.set('Cookie', [headers.get('Cookie'), cookie].filter(Boolean).join('; '))

  const response = await fetch(url, {
    method: config.method,
    headers,
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

The [example project](https://github.com/kubb-labs/plugins/tree/main/examples/client) adds a base URL setter and an async auth hook.

::::

::::tabs-item{label="On the shared runtime"}

Reuse the request pipeline of the fetch and axios clients and write only the transport:

1. Copy `core.ts`, `mediaTypes.ts`, `serializers.ts`, `standardSchema.ts`, `sse.ts`, and the `mediaTypes/` and `serializers/` files your spec needs from `@kubb/plugin-client/templates` next to your `client.ts`.
2. In `client.ts`, export the `NativeRequest`, `NativeResponse`, and `NativeOptions` types the core imports. On fetch they are `Request`, `Response`, and `RequestInit`.
3. Write a `Transport` function that sends a `ResolvedRequest` and returns a web `Response`. Wrap other results in `new Response(bytes, { status, headers })`. For a 204, 205, or 304 status, pass `null` as the body, or the constructor throws.
4. Export `createLazyClient((config) => createClientCore({ defaultTransport, ...config }))` as `client`, and add `export * from './core.ts'` and `export * from './sse.ts'`.
5. Register what the core does not ship: `client.setConfig({ mediaTypes: { 'multipart/form-data': multipartFormData, ...streamMediaTypes }, serializer: { query: serializeQuery, path: serializePath } })`. Add `header` and `cookie` serializers when the spec has such parameters.

[`@kubb/plugin-fetch/templates/client.ts`](https://github.com/kubb-labs/plugins/blob/main/packages/plugin-fetch/templates/client.ts) is a complete example.

::::

:::

## Authenticate

The plugin sends no credentials. Each call passes the operation's security requirements as `security`, and your client decides what to send:

```typescript
security: [{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'oauth2' }]
```

| Shape                                        | Meaning                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| No `security` field                          | The operation is public. Skip auth.                                                                      |
| One entry per requirement                    | Meeting one requirement is enough.                                                                       |
| An array inside the list                     | One requirement needs these schemes together, such as an API key and a session cookie. Send all of them. |
| `type: 'http'` with `scheme`                 | `'bearer'` or `'basic'`. Other HTTP schemes arrive as `'bearer'`.                                        |
| `type: 'oauth2'` with `flows`, `metadataUrl` | The flow URLs to get a token.                                                                            |
| `type: 'openIdConnect'` with `url`           | The discovery URL.                                                                                       |

Await a token before the request, so it can come from a secrets store or a refresh call:

:::code-group

```typescript [src/client.ts]
type GetToken = () => Promise<string | undefined>

let getToken: GetToken | undefined

export function setAuth(resolve: GetToken) {
  getToken = resolve
}

// inside send(), after `headers` and before fetch(). This sends bearer tokens only, not API keys or basic credentials.
const bearer = config.security?.flat().some((auth) => auth.type !== 'apiKey' && auth.scheme !== 'basic')
const token = bearer ? await getToken?.() : undefined
if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
```

```typescript [src/index.ts]
import { setAuth } from './client'

setAuth(async () => readTokenFromSecretsStore())
```

:::

For request signing, such as AWS SigV4, pass a different `client` on the call:

```typescript
await getPetById({ path: { petId: 1 }, client: createSignedClient() })
```

## Serialize parameters

When the spec sets `style`, `explode`, `allowReserved`, or `contentType` on a parameter, the call passes `styles`, grouped by location and keyed by parameter name:

```typescript
styles: {
  path: { petId: { style: 'matrix', explode: true } },
  query: { tags: { style: 'pipeDelimited', explode: false } },
}
```

- A parameter without an entry uses its location's default: `form` for query and cookie, `simple` for path and header.
- The shared runtime's `serializers.ts` applies every style.
- A client written from scratch applies them itself, or ignores `styles` when the spec only uses the defaults.
- See [Cookie parameters with the cookie style](#cookie-parameters-with-the-cookie-style) for the OpenAPI 3.2 `cookie` style.

The [plugin-fetch serialization guide](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/serialization) shows the output of each style.

## Register it

Point `importPath` at the module, resolved from the generated files:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginClient({ group: { type: 'tag' }, importPath: '../../../client' }),
  ],
})
```

Run `npx kubb generate`, then `npx tsc --noEmit`. A missing export or `RequestConfig` field shows up as a compile error in the generated files. With a relative `importPath`, the query plugins resolve it from the same generated file, so one path serves both.

::

## Less common cases

### Cookie parameters with the cookie style

When a cookie parameter sets the OpenAPI 3.2 `cookie` style, the call passes `style: 'cookie'` in `styles`:

```typescript
styles: { cookie: { session: { style: 'cookie' } } }
```

- Send its values without percent-encoding.
- OpenAPI 3.2 defaults `explode` to `true` for this style.
- The shared runtime throws a `TypeError` when a value has characters a cookie cannot carry.
