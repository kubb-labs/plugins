# Use a custom transport

Set a transport at runtime to replace the network send. The client still builds URLs, serializes parameters, resolves authentication, and handles results.

The transport is an `AxiosInstance`, or a function that takes the resolved request and returns a result, as in `@kubb/plugin-fetch`. The default is `defaultTransport`, an `axios.create()` instance exported from the generated client, and you can replace it with your own pre-configured instance. Use interceptors for request headers or response logging.

```typescript
type ClientConfig = {
  // ...
  transport?: AxiosInstance | Transport
}
```

Kubb forwards the resolved URL, query, body, and authentication to the instance.

## Pass a pre-configured instance

Give the client an instance with a timeout, default headers, and a logging interceptor:

```typescript
import axios from 'axios'
import { client } from './gen/.kubb/client'

const instance = axios.create({
  timeout: 10_000,
  headers: { 'X-Client': 'kubb' },
})

instance.interceptors.response.use((response) => {
  console.info(`${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`)
  return response
})

client.setConfig({ transport: instance })
```

Every generated function now sends through your instance, so its timeout, headers, and interceptors apply to each call. Handlers registered through `client.interceptors` stay on `defaultTransport`, so register them on your instance.

> [!NOTE]
> Kubb sets `url`, `method`, `headers`, `data`, `transformRequest`, `responseType`, and `validateStatus` on each request for its own serialization and status handling, so leave those fields alone. Set timeouts, retries, and interceptors on the instance. For one call, pass `options`, such as `{ timeout }` or `{ onUploadProgress }`, instead of building a new instance.

## Use the default instance

The generated client exports `defaultTransport`, the instance it sends through when no transport is set. Configure it directly to add tracing or headers without replacing the transport:

```typescript
import { defaultTransport } from './gen/.kubb/client'

defaultTransport.defaults.timeout = 10_000
defaultTransport.interceptors.request.use((config) => {
  config.headers.set('traceparent', currentTraceparent())
  return config
})
```

Instances from `createClient()` get their own `axios.create()` and do not share these settings.

## Where to set it

Use `client.setConfig({ transport })` for shared configuration, `createClient({ transport })` for an isolated instance, or pass `transport` on an operation to override it for one call.

## Write a transport function

A function transport receives the resolved request and returns the parsed body with the native request and response. `createAxiosTransport(instance)` is the one the client uses for an instance, and a custom function can wrap it:

```typescript
import { client, createAxiosTransport, defaultTransport } from './gen/.kubb/client'

const send = createAxiosTransport(defaultTransport)

client.setConfig({
  transport: (request) => withSpan(request, () => send(request)),
})
```
