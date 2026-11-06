# Use a custom transport

Set a transport at runtime to replace the network send. The client still builds URLs, serializes parameters, resolves authentication, and handles results.

The transport is a function. The default is `defaultTransport`, which sends through `axiosInstance`, an `axios.create()` instance exported from the generated client. Use interceptors for request headers or response logging.

## Pass a pre-configured instance

Wrap an instance with a timeout, default headers, and a logging interceptor in `createAxiosTransport`:

```typescript
import axios from 'axios'
import { client, createAxiosTransport } from './gen/.kubb/client'

const instance = axios.create({
  timeout: 10_000,
  headers: { 'X-Client': 'kubb' },
})

instance.interceptors.response.use((response) => {
  console.info(`${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`)
  return response
})

client.setConfig({ transport: createAxiosTransport(instance) })
```

Every generated function now sends through your instance, so its timeout, headers, and axios interceptors apply to each call. Interceptors registered through `client.interceptors` run around the transport and keep working when you swap it.

> [!NOTE]
> Kubb sets `url`, `method`, `headers`, `data`, `transformRequest`, `responseType`, and `validateStatus` on each request for its own serialization and `throwOnError` handling, so leave those fields alone. Set timeouts, retries, and interceptors on the instance. For one call, pass `options`, such as `{ timeout }` or `{ onUploadProgress }`, instead of building a new instance.

## Use the default instance

The generated client exports `axiosInstance`, the instance `defaultTransport` sends through when no transport is set. Configure it directly to add tracing or headers without replacing the transport:

```typescript
import { axiosInstance } from './gen/.kubb/client'

axiosInstance.defaults.timeout = 10_000
axiosInstance.interceptors.request.use((config) => {
  config.headers.set('traceparent', currentTraceparent())
  return config
})
```

Instances from `createClient()` share `axiosInstance` until you give them a transport of their own.

## Write a transport function

`@kubb/plugin-axios` types the transport as a function that receives a fully resolved request and returns a result, the same shape as `@kubb/plugin-fetch`:

```typescript
type Transport = (request: ResolvedRequest) => Promise<TransportResult>

type ResolvedRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: RequestBody
  signal?: AbortSignal
  options?: AxiosOptions
  responseType?: ResponseType
}

type TransportResult<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
  contentType?: string
  request: AxiosRequestConfig
  response: AxiosResponse
}
```

The core hands you a `ResolvedRequest` with the URL built, the query and body serialized, and auth headers set. Return the parsed `data` along with the native `request` and `response`, so status, headers, and the raw body stay reachable on the result. Return a fixed result from an isolated client to mock the network in tests.

## Where to set it

Use `client.setConfig({ transport })` for shared configuration, `createClient({ transport })` for an isolated instance, or pass `transport` on an operation to override it for one call.
