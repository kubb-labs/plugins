# Use a custom transport

Set a transport at runtime to replace the network send. The client still builds URLs, serializes parameters, resolves authentication, and handles results.

The transport is a function. Use interceptors for request headers or response logging.

## Write a transport function

`@kubb/plugin-fetch` types the transport as a function that receives a fully resolved request and returns a result:

```typescript
type Transport = (request: ResolvedRequest) => Promise<TransportResult>

type ResolvedRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: RequestBody
  signal?: AbortSignal
  credentials?: RequestCredentials
  options?: NativeOptions
  responseType?: ResponseType | ResponseTypeMap
}

type TransportResult<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
  contentType?: string
  request: Request
  response: Response
}
```

The core hands you a `ResolvedRequest` with the URL built, the query and body serialized, and auth headers set. Return the parsed `data` along with the native `request` and `response`, so status, headers, and the raw body stay reachable on the result. `responseType` is one parser, or a map from content type to parser when the operation returns several types. Call `resolveResponseType(request.responseType, contentType)` from the generated client to get the parser for a response.

## Mock the network in tests

Return a fixed result from an isolated client in tests:

```typescript
import { createClient } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

const testClient = createClient({
  transport: async (request) => ({
    data: { id: 1, name: 'Fluffy' },
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    request: new Request(request.url),
    response: new Response(),
  }),
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
