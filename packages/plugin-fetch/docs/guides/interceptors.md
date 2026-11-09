# Add interceptors

Register handlers on `client.interceptors.request`, `.response`, or `.error` to apply behavior across calls. Handlers receive the resolved request, the decoded result, and every error a call ends with.

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

Response handlers run after the body is decoded by its media type and before the client checks the status or runs
the validator, so a JSON body is already parsed. On a `client.stream` call, `data` is still the raw body stream. The
handler receives a `DecodedResponse` (`data`, `status`, `statusText`, `headers`, `contentType`, `request`, `response`):

```typescript
client.interceptors.response.use((result) => {
  console.info(`${result.status} ${result.contentType}`)
  return result
})
```

## React to an error

The error handlers see every failure of a call: a `ResponseError` for a non-2xx status, a network error, an abort, a
`ParseError` from a validator or from invalid JSON, and a `TypeError` from the runtime. Narrow with `ResponseError.is`:

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
returned `error` on the result. A failure inside a stream loop, after the call resolved, throws from the loop and does
not reach the error handlers.

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
same config and no handlers. `client.extend(config)` returns one that runs this client's handlers before its own,
including handlers added to the parent later:

```typescript
import { client } from './gen/.kubb/client'

const admin = client.extend({ headers: { 'X-Role': 'admin' } })
admin.interceptors.request.use((request) => request) // runs after the handlers on client
await getPetById({ path: { petId: 1 }, client: admin })
```
