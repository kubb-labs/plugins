# Configure requests

Set the base URL, credentials, shared headers, and interceptors on the generated Axios client, for every call or for one.

## Where settings apply

Every generated function sends through the shared `client` from `.kubb/client.ts`, unless a call passes its own:

| Scope             | How                         | Effect                                                                                  |
| ----------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| Every call        | `client.setConfig({ ... })` | Merges into the shared config. `headers`, `mediaTypes`, and `serializer` merge per key. |
| A separate client | `createClient({ ... })`     | Copies the shared config at creation, without its interceptors.                         |
| A child client    | `client.extend({ ... })`    | Copies the shared config and runs the parent's interceptors first.                      |
| One call          | The same key on the call    | Wins over the client for that call.                                                     |

The client takes `baseURL`, `headers`, `auth`, `credentials`, `options`, `transport`, `serializer`, `mediaTypes`, `validate`, `onValidationError`, and `retry`:

```typescript
import { client, createClient } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

client.setConfig({ baseURL: import.meta.env.VITE_API_URL, headers: { 'X-Client': 'web' } })

const tenant = createClient({ baseURL: 'https://tenant.example.com', auth: () => tenantToken })
await getPetById({ path: { petId: 1 }, client: tenant })

await getPetById({ path: { petId: 1 }, baseURL: 'http://localhost:3000' })
```

## Set the base URL

A call uses the first base URL it finds:

| Order | Source                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 1     | `baseURL` on the call.                                                                               |
| 2     | The operation's own `servers`, then its path's `servers`.                                            |
| 3     | The client passed as `client`.                                                                       |
| 4     | `client.setConfig({ baseURL })`.                                                                     |
| 5     | The plugin's [`baseURL`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#baseurl) option. |

> [!NOTE]
> The spec's top-level `servers` URL is never used, even with the `server` option of `adapterOas`.

See [Which server a call picks](#which-server-a-call-picks) and [Named servers](#named-servers).

## Authenticate requests

Set `auth` to a token, or to a sync or async function that gets each [security scheme](https://spec.openapis.org/oas/v3.1.0#security-scheme-object) of the call. It returns the token, or `undefined` to skip the scheme:

```typescript
client.setConfig({
  auth: (auth) => (auth.type === 'apiKey' ? apiKey : localStorage.getItem('token') ?? undefined),
})
```

The function runs again before each [retry](#retry-a-failed-call) and each reopen of an event stream, so it can return a fresh token. A static token is read once.

By default, `auth` adds no credentials. The scheme decides where the token goes:

| Scheme in the spec | `auth` gets                              | The token goes to               |
| ------------------ | ---------------------------------------- | ------------------------------- |
| `http` bearer      | `{ type: 'http', scheme: 'bearer' }`     | `Authorization: Bearer <token>` |
| `http` basic       | `{ type: 'http', scheme: 'basic' }`      | `Authorization: Basic <base64>` |
| `apiKey` in header | `{ type: 'apiKey', name, in: 'header' }` | the header named `name`         |
| `apiKey` in query  | `{ type: 'apiKey', name, in: 'query' }`  | the query parameter `name`      |
| `apiKey` in cookie | `{ type: 'apiKey', name, in: 'cookie' }` | the `Cookie` header             |
| `oauth2`           | `{ type: 'oauth2', scopes, flows }`      | `Authorization: Bearer <token>` |
| `openIdConnect`    | `{ type: 'openIdConnect', scopes, url }` | `Authorization: Bearer <token>` |

> [!NOTE]
> For basic auth, return the raw `username:password`. The runtime base64-encodes it and adds the `Basic` prefix.

For a credential that no security scheme describes, such as a request signature, add a request interceptor. See [Several security schemes](#several-security-schemes) and [Mutual TLS](#mutual-tls).

## Add interceptors

`client.interceptors` has three stacks. Each handler gets the value the one before it returned:

| Stack      | Runs                                                                         | Gets              | Returns                                        |
| ---------- | ---------------------------------------------------------------------------- | ----------------- | ---------------------------------------------- |
| `request`  | After the URL, body, and auth are built, before the send.                    | `ResolvedRequest` | The request.                                   |
| `response` | After the body is decoded, before the status check and validator.            | `DecodedResponse` | The result.                                    |
| `error`    | When a call fails: `ResponseError`, network error, abort, `ValidationError`. | The error         | Another error to throw, or nothing to keep it. |

::code-group

```typescript [request]
client.interceptors.request.use((request) => {
  request.headers['X-Request-ID'] = crypto.randomUUID()
  return request
})
```

```typescript [response]
client.interceptors.response.use((result) => {
  console.info(`${result.status} ${result.contentType}`)
  return result
})
```

```typescript [error]
import { client, ResponseError } from './gen/.kubb/client'

class NotFoundError extends Error {}

client.interceptors.error.use((error) => {
  if (ResponseError.is(error) && error.status === 401) scheduleTokenRefresh()
  if (ResponseError.is(error) && error.status === 404) return new NotFoundError(error.message)
})
```

::

`ResolvedRequest` has `url`, `method`, `headers`, `body`, `signal`, `credentials`, `options`, and `stream`. `DecodedResponse` has `data`, `status`, `statusText`, `headers`, `contentType`, `request`, and `response`.

Handlers run in the order you register them. `use` returns an id for `eject` and `update`:

```typescript
const id = client.interceptors.request.use((request) => request)
client.interceptors.request.update(id, (request) => ({ ...request, headers: { ...request.headers, 'X-Trace': 'on' } }))
client.interceptors.request.eject(id)
```

> [!NOTE]
> With `throwOnError: false`, a non-2xx response resolves, so no error handler runs for it. An error thrown while a stream is read, in the `for await` loop, does not reach the error handlers either.

### Native axios interceptors

For the native `InternalAxiosRequestConfig`, `AxiosResponse`, or `AxiosError`, register on the axios instance that `getAxiosInstance()` returns. Native response interceptors see the raw bytes, before Kubb decodes them:

```typescript
import { getAxiosInstance } from './gen/.kubb/client'

getAxiosInstance().interceptors.request.use((config) => {
  config.headers.set('traceparent', currentTraceparent())
  return config
})
```

For the order native and core handlers run in, see [Interceptor order](#interceptor-order).

Next, [use a custom transport](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/transport).

## Retry a failed call

Retries are off by default. Set `retry` on the client or on one call. A number is how many times a failed call is sent again:

```typescript
import { client } from './gen/.kubb/client'

client.setConfig({ retry: 2 })

await createOrder({ body, retry: { methods: ['POST'] } })
await chargeCard({ body, retry: false })
```

A call's `retry` merges per field over the client's, and `false` sends that call once. Pass an object for more control:

| Option        | What it does                                                                         | Default                                            |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `limit`       | How many times the call is sent again.                                               | `2`                                                |
| `methods`     | The methods that are safe to send twice.                                             | `GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`, `TRACE` |
| `statusCodes` | The statuses that are retried.                                                       | `408`, `429`, `500`, `502`, `503`, `504`           |
| `delay`       | `(retryCount) => milliseconds` to wait. `retryCount` starts at 1.                    | Exponential from 300 ms with jitter, up to 30 s    |
| `shouldRetry` | `({ request, response, error, retryCount })` returns `true`, `false`, or `undefined` | The status and error check                         |
| `onRetry`     | Runs before each wait, with the same context plus `delay`.                           | None                                               |

```typescript
client.setConfig({
  retry: {
    limit: 3,
    delay: (retryCount) => 1000 * retryCount,
    shouldRetry: ({ response }) => (response?.headers.get('x-no-retry') === 'true' ? false : undefined),
    onRetry: ({ retryCount, delay }) => console.warn(`Retry ${retryCount} in ${delay} ms`),
  },
})
```

The client retries a status in `statusCodes` and any error the transport throws, including its `timeout`. These rules always apply, also when `shouldRetry` returns `true`:

- `POST` and `PATCH` are retried only when `methods` names them.
- A stream body is never retried, because it cannot be read twice.
- A `Retry-After` header sets the wait. When it asks for more than a minute, the call is not retried.
- An aborted `signal` stops the wait and the retries.
- The request interceptors run once per call. An `auth` function runs again before each retry, so a retry can send a fresh token.

A streaming call uses the same `retry`, see [Stop, abort, and resume](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/server-sent-events#stop-abort-and-resume).

## Less common cases

### Which server a call picks

When an operation or path has its own `servers`, the [`server.index`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#server) of `adapterOas` picks the entry, falling back to the first. A relative URL such as `/v2`, or one with `{variable}` placeholders, is skipped, so the call uses the next source in [Set the base URL](#set-the-base-url).

The plugin's [`baseURL`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#baseurl) option is written into `.kubb/config.ts`, which `.kubb/client.ts` passes to `setConfig`.

### Named servers

When an OpenAPI 3.2 server has a `name`, `.kubb/client.ts` exports its URL in `servers`:

::code-group

```yaml [petStore.yaml]
servers:
  - url: https://api.example.com
    name: production
  - url: https://staging.example.com
    name: staging
```

```typescript [src/api.ts]
import { client, servers } from './gen/.kubb/client'

client.setConfig({ baseURL: servers.staging })
```

::

### Several security schemes

When an operation lists several security requirements, the runtime sends the first one whose schemes all get a token. A requirement that needs an API key and a session cookie sends both. A header or query key you set yourself wins over the token. An `oauth2` scheme also passes `metadataUrl` to `auth` when the spec has one.

`.kubb/client.ts` exports the spec's schemes by name as `securitySchemes`, and each generated call points at its own, with the scopes it needs:

```typescript
security: [{ ...securitySchemes.petstore_auth, scopes: ['write:pets'] }]
```

### Mutual TLS

When the spec has a `mutualTLS` scheme, `securitySchemes` leaves it out, because its credential is a client certificate on the connection, not on the request. In Node.js, give an axios instance the certificate:

```typescript
import { readFileSync } from 'node:fs'
import { Agent } from 'node:https'
import axios from 'axios'
import { client, createAxiosTransport } from './gen/.kubb/client'

const instance = axios.create({ httpsAgent: new Agent({ cert: readFileSync('client.crt'), key: readFileSync('client.key') }) })

client.setConfig({ transport: createAxiosTransport(instance) })
```

In the browser, the browser picks the client certificate itself.

### Interceptor order

When you register [native axios interceptors](#native-axios-interceptors) next to `client.interceptors`:

- Native request interceptors run after the `client.interceptors.request` handlers, in reverse order of registration, as axios runs them.
- Native response interceptors see the raw bytes, before Kubb decodes them.
- An instance you pass to `createAxiosTransport` keeps its own interceptors.
