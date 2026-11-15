# Use a custom transport

Replace the network send with another HTTP library or your own function. The client still builds the URL, serializes parameters, resolves auth, runs interceptors, and decodes the result.

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
  options?: NativeOptions // RequestInit plus Next.js's `next`
  stream?: boolean // the call streams the response, so do not buffer the body
}

type TransportResult = { webResponse: Response; request: Request; response: Response }
```

Return a `TransportResult` to set the native `request` and `response` that results and errors carry. With a plain `Response`, `request` is a `Request` built from the resolved request without its body, or the resolved request itself for a relative URL.

## Send with another library

A library that returns a `Response`, such as [ky](https://github.com/sindresorhus/ky), needs only the send. `toRequestInit(request)` gives the `RequestInit` that `fetch` and ky take:

```typescript
import ky from 'ky'
import { client, toRequestInit } from './gen/.kubb/client'

client.setConfig({
  transport: (request) => ky(request.url, { ...toRequestInit(request), throwHttpErrors: false, retry: 0, timeout: false }),
})
```

`client.interceptors` handlers keep running, whatever the transport.

> [!NOTE]
> The client splits success from error itself, so ky must not throw or retry on an error status. ky's `timeout` only waits for the response headers and never ends a started body or stream, so turn it off and bound the whole call with `signal: AbortSignal.timeout(ms)`. The library must hand back the body unread.

## Wrap the default transport

`defaultTransport` is the `fetch`-based send the client uses when no transport is set. Wrap it to add tracing, timing, or headers and keep the built-in request and response handling:

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

A client from `createClient()` copies the shared `transport` when you create it, and a later `client.setConfig({ transport })` does not reach it. Without a `transport` on either, it sends with the global `fetch`.
