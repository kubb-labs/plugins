# Handle errors

Handle HTTP and network errors in the generated Axios client with `ResponseError`, or return errors as values with `throwOnError: false`.

## What a call does

Only a non-2xx response depends on `throwOnError`:

| What happens                             | Result                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| 2xx response                             | Resolves with `data`.                                                                     |
| Non-2xx response                         | Throws a `ResponseError`. With `throwOnError: false`, resolves with `error` and `status`. |
| A body fails its schema (`validator` on) | Throws a `ValidationError`.                                                               |
| Invalid JSON under a JSON media type     | Throws a `ValidationError`.                                                               |
| Network failure, DNS failure, or timeout | Rejects with the native `AxiosError`.                                                     |
| Aborted `signal`                         | Rejects with the signal's reason.                                                         |

Every failure that rejects with an `Error` also reaches [`client.interceptors.error`](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/configure-requests#add-interceptors). An abort whose reason is not an `Error`, such as `abort('canceled')`, skips it.

## Catch a ResponseError

Narrow with `ResponseError.is(error)` instead of `instanceof`, because each generated package bundles its own `ResponseError` class:

```typescript
import { getPetById } from './gen/clients/getPetById'
import { ResponseError } from './gen/.kubb/client'

try {
  const { data } = await getPetById({ path: { petId: 1 } })
} catch (error) {
  if (ResponseError.is(error)) console.error(error.status, error.data) // 404, the parsed error body
}
```

```typescript
class ResponseError extends Error {
  data: TError // the parsed error body
  status: number
  statusText: string
  contentType: string | undefined
  headers: Headers // such as error.headers.get('Retry-After')
  request: AxiosRequestConfig
  response: AxiosResponse
}
```

The `message` leaves out the query string: `GET https://api.example.com/pets/1 failed with status 404 Not Found`. `request` and `response` keep the full URL, so redact them before you log the whole error.

> [!NOTE]
> The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype). With the default `bigint`, an `int64` id takes `1n`.

## Narrow a thrown error by status

`isResponseError<Responses>(error)` narrows a caught error to one operation's `ResponseError`. A check on `status` then narrows `data`. For range keys such as `4xx`, see [Status ranges](#status-ranges):

```typescript
import { isResponseError } from './gen/.kubb/client'
import type { GetPetByIdResponses } from './gen/types/GetPetById'

try {
  await getPetById({ path: { petId: 7 } })
} catch (error) {
  if (isResponseError<GetPetByIdResponses>(error) && error.status === 404) {
    console.error(error.data) // GetPetById404
  }
}
```

> [!WARNING]
> The type argument is not checked at runtime, so keep the `try` around one operation.

## Return the error instead

With `throwOnError: false`, the call resolves for every status. `data` is set on success and `error` on failure, and a check on `status` narrows both:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error !== undefined) console.error(result.status, result.error)
else console.info(result.data)
```

See [Empty error bodies and default responses](#empty-error-bodies-and-default-responses).

## Set the generated default

[`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#throwonerrordefault) on the plugin sets what a call does when it leaves `throwOnError` out. `client.setConfig({ throwOnError })` does not change it:

```typescript
pluginAxios({ throwOnErrorDefault: false })

const list = await searchPets({ query: { status: 'available' } }) // resolves with an error result
const pet = await getPetById({ path: { petId: 1 }, throwOnError: true }) // throws
```

## Validation failures

With [`validator`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#validator) on, a body that does not match its Zod schema throws a `ValidationError` with the schema's `issues`:

```typescript
import { ValidationError } from './gen/.kubb/standardSchema'

try {
  await getPetById({ path: { petId: 1 } })
} catch (error) {
  if (error instanceof ValidationError) console.error(error.issues) // [{ message, path }]
}
```

`ValidationError` was called `ParseError`. The old name is still exported and deprecated, so `instanceof ParseError` keeps working. `error.name` is now `'ValidationError'`.

A `ValidationError` from a response body also carries `status`, `method`, `direction` (`'response'` or `'error'`), and `source`. So when a non-2xx body does not match its error schema, the status is still there:

```typescript
if (error instanceof ValidationError && error.status === 404) return null
```

To recover from a schema failure, pass `onValidationError` on the call or the client. Return `{ value }` to use that value, or nothing to throw the `ValidationError`:

```typescript
client.setConfig({
  onValidationError: (error, { direction, source, value }) => {
    console.warn(direction, source, error.issues)
    return { value }
  },
})
```

Invalid JSON does not reach the handler. When the handler returns `{ value }` for an error body, the call throws the `ResponseError` as usual, with that value as `data`. The handler's `error` carries the `status`, so read the `issues` there. With `throwOnError: false`, the call resolves with that value as `error` instead. A `null`, `undefined`, or `''` value resolves as `{ status, statusText }`, like an [empty error body](#empty-error-bodies-and-default-responses).

For which schema checks an error body, see [Error body validation](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization#error-body-validation).

## Turn validation off at runtime

`validator` decides at generation time which schemas a call carries. `validate` skips them at runtime, for example in production or in tests with partial fixtures:

```typescript
client.setConfig({ validate: import.meta.env.DEV })
client.setConfig({ validate: { response: false } }) // skip one direction
```

The default is `true`. The object form skips each direction set to `false`: `request` (the body), `params`, `response`, or `error`. A per-call `validate` overrides the client.

## Less common cases

### Status ranges

When an operation declares a range key such as `4xx`, the range covers its statuses that have no entry of their own, and `default` covers the rest.

### Empty error bodies and default responses

When a failed call has an empty body, `error` is `{ status, statusText }`.

When the operation declares a `default` response, a check on `status` does not narrow `data` and `error`, because a `default` status can be any number. To get the success body with the default `returnType: 'full'`, call `.unwrap()`, which turns `error` into a rejection. With `returnType: 'data'`, the call returns a plain promise without `.unwrap()`.

### Where the `throwOnError` default comes from

When you set `client.setConfig({ throwOnError })`, generated calls ignore it, because each generated function passes its own value: the call's `throwOnError`, or else [`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#throwonerrordefault). That value is also the default of the function's `ThrowOnError` type parameter.

### Read headers with `returnType: 'data'`

When the plugin sets [`returnType: 'data'`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#returntype), a call resolves to the success body alone. To read a header such as `ETag`, pass `throwOnError: false` and call `result.headers.get('etag')`. For a stream call, see [Event IDs when you resume](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/server-sent-events#event-ids-when-you-resume).

The query plugins and `@kubb/plugin-mcp` read `returnType` too, including a per-operation value from [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override).
