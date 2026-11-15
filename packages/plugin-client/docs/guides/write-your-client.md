# Write your client

Build the client module that every generated function imports through `importPath`, from the contract it must meet to the config that points at it. You own this module and its transport, auth, and error handling.

::steps{level="2"}

## Check the contract

The generated files import these names from your module. Export the ones your config and spec need.

| Export                                                   | Kind           | Needed when                                                                       |
| -------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| `client`                                                 | function       | Always. A call that passes its own `client` uses that one instead.                |
| `Options`                                                | type           | Always. The grouped options object a generated function takes.                    |
| `RequestResult`                                          | type           | `returnType` is `'plain'` (default) or `'full'`.                                  |
| `client.stream`, `StreamResult`                          | method, type   | The spec has Server-Sent Events or JSON Lines operations.                         |
| `SuccessOf`, `TypedEvent`                                | type           | A stream names each event (both) or streams JSON Lines (`SuccessOf`).             |
| `withUnwrap`, `resolveThrowOnError`, `Unwrappable`       | function, type | `returnType: 'full'`. Streams also import `StreamOptions`.                        |
| `unwrapResult`, `resolveThrowOnError`, `UnwrappedResult` | function, type | `returnType: 'data'`. Streams import `StreamOptions` and `UnwrappedStreamResult`. |
| `toHeadersStandardSchema`                                | function       | `validator: { params: 'zod' }`.                                                   |
| `RequestConfig`, `ResponseErrorConfig`                   | type           | A query plugin calls the generated functions.                                     |

The query plugins and `@kubb/plugin-mcp` call the generated functions with `throwOnError: true` and read `data` off the result, so your `RequestResult` needs a `data` field.

A generated function calls your client with two or three type arguments:

| Call                                                     | Must return                                              |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `client<TResponses, ThrowOnError>(config)`               | `Promise<RequestResult<TResponses, ThrowOnError>>`       |
| `client.stream<TResponses, ThrowOnError, TItem>(config)` | `Promise<StreamResult<TResponses, ThrowOnError, TItem>>` |

`TItem` is `TypedEvent<…>` when the document names each event, and the success type for JSON Lines. When the document types only the payload, the call leaves `TItem` out, so give it a default such as `ServerSentEvent<SuccessOf<TResponses>>`.

`config` carries these fields. Declare each one your spec produces on your `RequestConfig` type, or the generated files fail to compile.

| Field                                         | Passed when                                                                                            | Value                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `method`                                      | Always                                                                                                 | The upper-case HTTP method.                                                                                                                            |
| `url`                                         | Always                                                                                                 | The path template with `{param}` placeholders, such as `'/pet/{petId}'`.                                                                               |
| `throwOnError`                                | Always                                                                                                 | The caller's value, else [`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#throwonerrordefault).                     |
| `path`, `query`, `headers`, `cookies`, `body` | The caller passes them                                                                                 | Typed from the spec. `cookies` holds name and value pairs.                                                                                             |
| `baseURL`                                     | The path or operation declares its own `servers`                                                       | That server's URL. Use it when it is set.                                                                                                              |
| `security`                                    | The operation has security requirements                                                                | See [Authenticate](#authenticate).                                                                                                                     |
| `styles`                                      | A parameter sets `style`, `explode`, `allowReserved`, or `contentType`                                 | See [Serialize parameters](#serialize-parameters).                                                                                                     |
| `contentType`                                 | The operation has a body, streams, or offers `text/event-stream`                                       | `request` is the body's media type, `response` the one to ask for in `Accept`.                                                                         |
| `parseAs`                                     | Every success content type is binary                                                                   | `'blob'`                                                                                                                                               |
| `eventShape`                                  | A Server-Sent Events operation                                                                         | `'event'` or `'data'`: what `validator.response` checks on each event.                                                                                 |
| `rawData`                                     | A Server-Sent Events operation types `data` as a string                                                | `true`, or the names of those events. Keep their `data` as text.                                                                                       |
| `validator`                                   | The [`validator`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#validator) option is set | The schemas to run. See [Validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses). |

Anything else the caller passes, such as `signal`, reaches your client through `...config`. A generated function looks like this:

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

The client below uses `fetch` and reads JSON. Replace `send` with the HTTP library you use.

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
  for (const [key, value] of Object.entries(config.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  const cookie = Object.entries(config.cookies ?? {})
    .filter(([, value]) => value != null)
    .map(([name, value]) => `${name}=${encodeURIComponent(String(value))}`)
    .join('; ')
  const headers: Record<string, string> = {
    ...(config.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(config.headers as Record<string, string>),
    ...(cookie ? { Cookie: cookie } : {}),
  }

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

The [example project](https://github.com/kubb-labs/plugins/tree/main/examples/client) has a fuller version with a base URL setter and an async auth hook.

::::

::::tabs-item{label="On the shared runtime"}

Reuse the request pipeline of the fetch and axios clients and write only the transport:

1. Copy `core.ts`, `mediaTypes.ts`, `serializers.ts`, `standardSchema.ts`, `sse.ts`, and the `mediaTypes/` and `serializers/` files your spec needs from `@kubb/plugin-client/templates` next to your `client.ts`.
2. In `client.ts`, export the `NativeRequest`, `NativeResponse`, and `NativeOptions` types the core imports. On fetch they are `Request`, `Response`, and `RequestInit`.
3. Write a `Transport` function that sends a `ResolvedRequest` and returns a web `Response`. If your library returns something else, wrap its bytes in `new Response(bytes, { status, headers })`.
4. Export `createLazyClient((config) => createClientCore({ defaultTransport, ...config }))` as `client`, and add `export * from './core.ts'` and `export * from './sse.ts'`.
5. Register what the core does not ship: `client.setConfig({ mediaTypes: { 'multipart/form-data': multipartFormData, ...streamMediaTypes }, serializer: { query: serializeQuery, path: serializePath } })`. Add `header` and `cookie` serializers when the spec has such parameters.

[`@kubb/plugin-fetch/templates/client.ts`](https://github.com/kubb-labs/plugins/blob/main/packages/plugin-fetch/templates/client.ts) is a complete example.

::::

:::

> [!TIP]
> Kubb does not depend on retries, interceptors, or request signing. Add them to `client` when you need them.

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
| `type: 'oauth2'` with `flows`, `metadataUrl` | The flow URLs, such as the OpenAPI 3.2 `deviceAuthorization` flow, to get a token.                       |
| `type: 'openIdConnect'` with `url`           | The discovery URL.                                                                                       |

The client can `await` a token before it sends the request, so the token can come from a secrets store or a refresh call:

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
if (token) headers.Authorization ??= `Bearer ${token}`
```

```typescript [src/index.ts]
import { setAuth } from './client'

setAuth(async () => readTokenFromSecretsStore())
```

:::

For request signing, such as AWS SigV4, or a service with other credentials, pass a different `client` on the call. It replaces the default for that call only:

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

A parameter without an entry uses the default for its location: `form` for query and cookie, `simple` for path and header. A cookie with the OpenAPI 3.2 `cookie` style passes `style: 'cookie'`, and its values go out unencoded. The shared runtime's `serializers.ts` applies all of these. A client written from scratch applies them itself, or ignores `styles` when the spec only uses the defaults. The [plugin-fetch serialization guide](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/serialization) shows the output of each style.

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
