# Add interceptors

Register handlers on `client.interceptors.request`, `.response`, or `.error` to apply behavior across calls. Handlers receive the resolved request, the decoded result, or the error a call ends with.

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
`credentials`, `options`, `stream`).

## Run after the send

Response handlers run after the body is decoded and before the status check and the validator, so a JSON body is
already parsed. On a `client.stream` call, `data` is the raw body stream. The handler receives a `DecodedResponse`
(`data`, `status`, `statusText`, `headers`, `contentType`, `request`, `response`):

```typescript
client.interceptors.response.use((result) => {
  console.info(`${result.status} ${result.contentType}`)
  return result
})
```

## React to an error

Error handlers get every failure: a `ResponseError` for a non-2xx status, a network error, an abort, or a
`ParseError`. Narrow with `ResponseError.is`:

```typescript
import { client, ResponseError } from './gen/.kubb/client'

client.interceptors.error.use((error) => {
  if (ResponseError.is(error) && error.status === 401) scheduleTokenRefresh()
  if (error.name === 'AbortError') console.info('canceled')
  return error
})
```

Return another error, such as a domain error, and the call throws it instead. Each handler receives the error the one
before it returned. A handler that returns nothing keeps the error:

```typescript
class NotFoundError extends Error {}

client.interceptors.error.use((error) => (ResponseError.is(error) && error.status === 404 ? new NotFoundError(error.message) : error))
```

With `throwOnError: false`, a documented non-2xx response resolves and no error handler runs for it, so inspect the
returned `error` on the result. An error inside a stream loop throws from the loop and skips the error handlers.

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

Register handlers on the shared `client` for all operations. `client.createClient(config)` returns an instance with the
same config and no handlers. `client.extend(config)` returns one that runs the parent's handlers, even those added
later, before its own:

```typescript
import { client } from './gen/.kubb/client'

const admin = client.extend({ headers: { 'X-Role': 'admin' } })
admin.interceptors.request.use((request) => request) // runs after the handlers on client
await getPetById({ path: { petId: 1n }, client: admin })
```

## Native axios interceptors

To get the native `InternalAxiosRequestConfig`, `AxiosResponse`, or `AxiosError`, register an axios interceptor on `getAxiosInstance()`:

```typescript
import { getAxiosInstance } from './gen/.kubb/client'

getAxiosInstance().interceptors.request.use((config) => {
  config.headers.set('traceparent', currentTraceparent())
  return config
})
```

Native axios interceptors run after the `client.interceptors` request handlers, in reverse order of registration, and response interceptors see the raw bytes. An instance you wrap with `createAxiosTransport` keeps its own interceptors. See [Use a custom transport](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/transport).
