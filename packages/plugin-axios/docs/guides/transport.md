# Use a custom transport

Replace the network send of the generated axios client with your own axios instance or function.

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
  options?: NativeOptions // AxiosRequestConfig
  stream?: boolean // the call streams the response, so do not buffer the body
}

type TransportResult = { webResponse: Response; request: AxiosRequestConfig; response: AxiosResponse }
```

Return a `TransportResult` to set the native `request` and `response` that results and errors carry. See [Transport results](EDGE:transport-results) for what a plain `Response` gives.

## Send through your own axios instance

`createAxiosTransport(instance)` turns any axios instance into a transport, with its defaults, adapter, and interceptors:

```typescript
import axios from 'axios'
import { client, createAxiosTransport } from './gen/.kubb/client'

const instance = axios.create({ timeout: 10_000, headers: { 'X-Client': 'kubb' } })

instance.interceptors.response.use((response) => {
  console.info(`${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`)
  return response
})

client.setConfig({ transport: createAxiosTransport(instance) })
```

> [!NOTE]
> Kubb sets `url`, `method`, `headers`, `data`, `transformRequest`, `transformResponse`, `responseType`, and `validateStatus`, so leave those alone. For one call, pass `options`, such as `{ timeout }`, instead of a new instance.

## Wrap the default transport

`defaultTransport` sends through the instance `getAxiosInstance()` returns. Configure that instance, or wrap the transport to add tracing or timing:

```typescript
import { client, defaultTransport, getAxiosInstance } from './gen/.kubb/client'

getAxiosInstance().defaults.timeout = 10_000

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

A client from `createClient()` copies the shared `transport` at creation, so a later `client.setConfig({ transport })` does not reach it. Without a `transport`, it sends through `getAxiosInstance()`.
