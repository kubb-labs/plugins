# Use a custom transport

Set a transport at runtime to replace the network send. The client still builds URLs, serializes parameters, resolves authentication, and handles results.

The transport is a function that takes the resolved request and returns the parsed body with the native request and response, as in `@kubb/plugin-fetch`. The default is `defaultTransport`, which sends through `axiosInstance`, an `axios.create()` instance exported from the generated client. `createAxiosTransport(instance)` turns any axios instance into a transport.

```typescript
type ClientConfig = {
  // ...
  transport?: Transport
}
```

## Send through a pre-configured instance

Wrap an instance with a timeout, default headers, and a logging interceptor:

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

Every generated function now sends through your instance, so its timeout, headers, and axios interceptors apply to each call. Handlers registered through `client.interceptors` keep running, whatever the transport.

> [!NOTE]
> Kubb sets `url`, `method`, `headers`, `data`, `transformRequest`, `transformResponse`, `responseType`, and `validateStatus` for its own serialization and status handling, so leave those fields alone. Set timeouts, retries, and interceptors on the instance. For one call, pass `options`, such as `{ timeout }` or `{ onUploadProgress }`, instead of building a new instance.

## Configure the default instance

The generated client exports `axiosInstance`, the instance `defaultTransport` sends through. Configure it directly to add tracing or headers without replacing the transport:

```typescript
import { axiosInstance } from './gen/.kubb/client'

axiosInstance.defaults.timeout = 10_000
axiosInstance.interceptors.request.use((config) => {
  config.headers.set('traceparent', currentTraceparent())
  return config
})
```

An instance from `createClient()` copies the `transport` of `client` when you create it, unless you pass its own. A later `client.setConfig({ transport })` does not reach it. Without a `transport` on either, it sends through `axiosInstance`.

## Where to set it

Use `client.setConfig({ transport })` for shared configuration, `createClient({ transport })` for an isolated instance, or pass `transport` on an operation to override it for one call.

## Write a transport function

A custom function can wrap `defaultTransport`, or the transport of any instance:

```typescript
import { client, defaultTransport } from './gen/.kubb/client'

client.setConfig({
  transport: (request) => withSpan(request, () => defaultTransport(request)),
})
```
