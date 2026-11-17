# Use a custom transport

Send the generated client through your own Ky instance, or replace the network send with your own function.

The client still builds the URL, serializes parameters, resolves auth, runs interceptors, and decodes the result. `client.interceptors` handlers keep running, whatever the transport.

## Write a transport function

A transport gets the resolved request and returns a web `Response` with its body unread:

```typescript
type Transport = (request: ResolvedRequest) => Promise<Response | TransportResult>

type ResolvedRequest = {
  url: string // built, with the query
  method: string
  headers: Record<string, string> // auth headers included
  body?: RequestBody // already encoded
  signal?: AbortSignal
  credentials?: RequestCredentials
  options?: NativeOptions // Ky options
  stream?: boolean // the call streams the response, so do not buffer the body
}

type TransportResult = { webResponse: Response; request: Request; response: Response }
```

Return a `TransportResult` to set the native `request` and `response` that results and errors carry. See [Results from a plain `Response`](#results-from-a-plain-response).

## Use your own Ky instance

`createKyTransport` sends through a Ky instance and keeps its defaults, retries, and hooks:

```typescript
import ky from 'ky'
import { client, createKyTransport } from './gen/.kubb/client'

const instance = ky.create({ timeout: 5000, hooks: { beforeRequest: [({ request }) => request.headers.set('traceparent', currentTraceparent())] } })

client.setConfig({ transport: createKyTransport(instance) })
```

> [!NOTE]
> Leave `prefix` and `baseUrl` off the instance, and set the base URL with [`baseURL`](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/configure-requests#set-the-base-url). The transport sets `throwHttpErrors: false`, because the client splits success from error itself, and still retries a status by the instance's `retry` options.

## Wrap the default transport

`defaultTransport` is the Ky send the client uses when no transport is set. Wrap it to add tracing, timing, or headers:

```typescript
import { client, defaultTransport } from './gen/.kubb/client'

client.setConfig({
  transport: (request) => withSpan(request, () => defaultTransport(request)),
})
```

## Mock the network in tests

Return a fixed `Response` from a separate client, and pass it to the call or to a query plugin:

```typescript
import { createClient } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

const testClient = createClient({ transport: async () => Response.json({ id: 1, name: 'Fluffy' }) })

const { data } = await getPetById({ path: { petId: 1 }, client: testClient })
//      ^ { id: 1, name: 'Fluffy' }
```

## Where to set it

| Scope             | How                               |
| ----------------- | --------------------------------- |
| Every call        | `client.setConfig({ transport })` |
| A separate client | `createClient({ transport })`     |
| One call          | `transport` on the call           |

A client from `createClient()` copies the shared `transport` at creation, so a later `client.setConfig({ transport })` does not reach it. Without a `transport`, it sends with `ky`.

## Less common cases

### Results from a plain `Response`

When a transport returns a plain `Response`, results and errors carry it as `response`. Their `request` is a `Request` built from the resolved request without its body, or the resolved request itself when `Request` cannot parse the URL, such as a relative URL in Node.js. Return a `TransportResult` to set both, as [Write a transport function](#write-a-transport-function) shows.

### What Ky's timeout covers

Ky's `timeout` only waits for the response headers and never ends a started body or stream. To bound the whole call, pass `signal: AbortSignal.timeout(ms)`.
