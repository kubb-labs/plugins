# Call operations

Call a generated function with grouped request options, read the typed result, and pass content types or Ky options for one call.

## Call an operation

Pass each request part under its own key: `path`, `query`, `headers`, `cookies`, or `body`. A key exists only when the operation declares that part:

```typescript
import { getPetById } from './gen/clients/getPetById'
import { updatePet } from './gen/clients/updatePet'

const { data } = await getPetById({ path: { petId: 1 } })
//      ^ the parsed pet, typed from the 200 response

await updatePet({ path: { petId: 1 }, headers: { 'X-Request-ID': 'r-1' }, body: { name: 'Rex', status: 'sold' } })

await getStatus() // no required parameters, no argument
```

Path keys keep the spec's names, so `{pet-id}` takes `path: { 'pet-id': 1 }`. Set [`pathParamsCasing: 'camelcase'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing) on the adapter (`@kubb/adapter-oas` 5.20.0 or later) to pass `petId` instead.

> [!NOTE]
> The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype). With the default `bigint`, an `int64` id takes `1n`.

## Read the result

A call resolves to a `RequestResult`, a union narrowed by the numeric `status`:

```typescript
type RequestResult = {
  status: number
  data: TData // the parsed success body, undefined on an error result
  error: TError // the parsed error body, undefined on a success result
  contentType: string | undefined // the response media type, without parameters
  headers: Headers // the response headers
  request: Request // the native request
  response: Response // the native response
}
```

With the default `throwOnError: true`, a resolved call is always a success. Narrow on `status` when an operation has several success statuses:

```typescript
const result = await getPetById({ path: { petId: 1 } })

console.info(result.headers.get('x-ratelimit-remaining')) // suggests the declared header names
if (result.status === 200) console.info(result.data)
```

## Unwrap the success body

Call `.unwrap()` to get only the success body:

```typescript
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
//    ^ the parsed pet
```

| `throwOnError`   | A non-2xx response makes `.unwrap()`              |
| ---------------- | ------------------------------------------------- |
| `true` (default) | throw a `ResponseError`, as a plain `await` does. |
| `false`          | reject with the parsed error body.                |

To get the body from every call, set [`returnType: 'data'`](https://kubb.dev/extensions/kubb-labs/plugin-ky/options#returntype) on the plugin.

## Set the content type

When an operation accepts or returns several content types, set `contentType` on the call. A string sets `Content-Type`, and `response` sets `Accept`:

::code-group

```typescript [Request only]
await uploadAvatar({ path: { petId: 1 }, body: avatarBlob, contentType: 'image/png' })
```

```typescript [Request and Accept]
await getPet({ path: { petId: 1 }, contentType: { request: 'application/json', response: 'application/xml' } })
```

::

## Pass Ky options

Pass `options` for [Ky options](https://github.com/sindresorhus/ky#options) such as `retry`, `timeout`, and `hooks`, or `fetch` settings such as `cache` and `redirect`:

```typescript
await getPetById({ path: { petId: 1 }, options: { timeout: 5000, retry: { limit: 3 } } })
```

`client.setConfig({ options })` sets shared defaults, and per-call options win. Kubb sets the method, headers, body, and signal over them, and sets `throwHttpErrors: false` to keep control of status handling.

Ky's defaults apply unless you change them:

| Option    | Default                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `timeout` | 10 seconds to get the response headers. Set `false` to wait without a limit.                                                         |
| `retry`   | 2 retries after a network error or a status such as `429` or `503`, for every method except `POST` and `PATCH`. Set `0` to turn off. |

After the last retry, the call gets the last response, and [handles it as an error](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/error-handling). See [Retry timing](#retry-timing) for `Retry-After`.

## Build a URL without sending

`client.getUrl` builds the URL a request would use, with the same base URL and serialization:

```typescript
import { client } from './gen/.kubb/client'

const url = client.getUrl({ url: '/pets/{petId}', path: { petId: 1 }, query: { fields: 'name' } })
// https://petstore.swagger.io/v2/pets/1?fields=name
```

Next, [handle errors](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/error-handling), including `throwOnError: false`.

## Less common cases

### Path parameter casing

When you set [`pathParamsCasing: 'camelcase'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing), the HTTP request stays the same, because path parameter names never reach the wire. The exception is the `matrix` style, which sends the name (`;group-id=42`), so an operation with a matrix path parameter keeps its spec names.

### Retry timing

Kubb reads the error body itself, so it retries a status with its own `afterResponse` hook, by Ky's `retry.limit`, `retry.methods`, and `retry.statusCodes`. The wait between tries comes from `retry.delay`, and a `Retry-After` header is not read. To follow one, add your own hook:

```typescript
import ky from 'ky'
import { client } from './gen/.kubb/client'

client.setConfig({
  options: {
    hooks: {
      afterResponse: [
        ({ response, retryCount, options }) => {
          const seconds = Number(response.headers.get('Retry-After'))
          return seconds > 0 && retryCount < options.retry.limit ? ky.retry({ delay: seconds * 1000 }) : undefined
        },
      ],
    },
  },
})
```

### TRACE operations

When the spec has a `trace` operation, Kubb generates a call for it, but Ky rejects the `TRACE` method. Use `@kubb/plugin-axios` or a [custom transport](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/transport) for it.
