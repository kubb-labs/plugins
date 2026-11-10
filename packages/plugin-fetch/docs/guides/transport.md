# Use a custom transport

Set a transport at runtime to replace the network send. The client still builds URLs, serializes parameters, resolves authentication, and handles results.

The transport is a function. Use interceptors for request headers or response logging.

## Write a transport function

`@kubb/plugin-fetch` types the transport as a function that receives a fully resolved request and returns a web `Response`:

```typescript
type Transport = (request: ResolvedRequest) => Promise<Response | TransportResult>

type ResolvedRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: RequestBody
  signal?: AbortSignal
  credentials?: RequestCredentials
  options?: NativeOptions
  // Set when the call streams the response. Do not buffer the body.
  stream?: boolean
}

type TransportResult = {
  webResponse: Response
  request: Request
  response: Response
}
```

The `ResolvedRequest` has the URL built, the query and body encoded, and auth headers set. Return the `Response` with its body unread. Return a `TransportResult` to set the native `request` and `response` on results and errors.

## Send with another library

A library that returns a `Response`, such as [ky](https://github.com/sindresorhus/ky), needs only the send. `toRequestInit(request)` gives the `RequestInit` that `fetch` and ky take:

```typescript
import ky from 'ky'
import { client, toRequestInit } from './gen/.kubb/client'

client.setConfig({
  // The client splits success from error itself, so ky must not throw or retry on an error status. ky's `timeout`
  // (10 seconds by default) only waits for the response headers and never ends a started body or stream. Turn it
  // off and bound the whole call with `signal: AbortSignal.timeout(ms)`.
  transport: (request) => ky(request.url, { ...toRequestInit(request), throwHttpErrors: false, retry: 0, timeout: false }),
})
```

The library must hand back the body unread. `result.request` is then a `Request` built from the resolved request, without its body, since the library keeps its own. With a relative URL, it is the resolved request itself.

## Mock the network in tests

Return a fixed result from an isolated client in tests:

```typescript
import { createClient } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

const testClient = createClient({
  transport: async () => Response.json({ id: 1, name: 'Fluffy' }),
})

const { data } = await getPetById({ path: { petId: 1 }, client: testClient })
//      ^ { id: 1, name: 'Fluffy' }
```

Pass the isolated client per operation or to a query plugin.

## Where to set it

Use `client.setConfig({ transport })` for shared configuration, `createClient({ transport })` for an isolated instance, or pass `transport` on an operation to override it for one call.

## Wrap the default transport

The generated client exports `defaultTransport`, the `fetch`-based send it uses when no transport is set. Wrap it to add tracing, timing, or headers and keep the built-in request and response handling:

```typescript
import { client, defaultTransport } from './gen/.kubb/client'

client.setConfig({
  transport: (request) => withSpan(request, () => defaultTransport(request)),
})
```
