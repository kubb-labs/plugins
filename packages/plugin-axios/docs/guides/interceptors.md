# Add interceptors

Register handlers on `client.interceptors.request`, `.response`, or `.error` to apply behavior across calls. They receive a `ResolvedRequest`, a `TransportResult`, or a `ResponseError`, as on the fetch client.

## Run before the send

Request handlers run after URL construction, serialization, and authentication. Return the modified request:

```typescript
import { client } from './gen/.kubb/client'

client.interceptors.request.use((request) => {
  request.headers['X-Request-ID'] = crypto.randomUUID()
  return request
})
```

The handler receives a `ResolvedRequest` (`url`, `method`, `headers`, `body`, `signal`,
`credentials`, `options`, `responseType`).

## Run after the send

Response handlers run before the client checks the status or runs a codec. `data` is the body as
the transport read it, so a JSON body is already parsed unless the call sets `responseType: 'text'`.
The handler receives a `TransportResult` (`data`, `status`, `statusText`, `headers`, `contentType`,
`request`, `response`):

```typescript
client.interceptors.response.use((result) => {
  console.info(`${result.status} ${result.request.url}`)
  return result
})
```

## React to an error

Use an error handler to react to HTTP errors on the throwing path. The handler receives the
`ResponseError`:

```typescript
client.interceptors.error.use((error) => {
  if (error.status === 401) scheduleTokenRefresh()
  return error
})
```

This channel only fires on the throw path. When you read with `throwOnError: false`, a documented
non-2xx response resolves and no error interceptor runs, so inspect the returned `error` on the
result instead. A network error, with no response, still throws, and the error handler does not run
for it. To react to one, add an error callback on `axiosInstance.interceptors.response`, as in
[Native axios interceptors](#native-axios-interceptors).

## Add, replace, and remove handlers

`use` registers a handler and returns an id. Pass that id to `eject` to remove it, or to `update`
to swap its function in place.

> [!NOTE]
> Handlers run in the order you register them.

```typescript
const id = client.interceptors.request.use((request) => request)

client.interceptors.request.update(id, (request) => {
  request.headers['X-Trace'] = 'on'
  return request
})

client.interceptors.request.eject(id)
```

## Where to set them

Register handlers on the shared `client` for all operations, or on a separate `createClient` instance for isolated calls. Interceptors are instance-level settings.

## Native axios interceptors

To get the native `InternalAxiosRequestConfig`, `AxiosResponse`, or `AxiosError`, register an axios interceptor on `axiosInstance`, the instance `defaultTransport` sends through:

```typescript
import { axiosInstance } from './gen/.kubb/client'

axiosInstance.interceptors.request.use((config) => {
  config.headers.set('traceparent', currentTraceparent())
  return config
})
```

Axios runs these after the `client.interceptors` request handlers, and in reverse order of registration. An instance you wrap with `createAxiosTransport` keeps its own axios interceptors. See [Use a custom transport](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/transport).
