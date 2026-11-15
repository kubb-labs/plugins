# Call operations

Call a generated function with grouped request options, read the typed result, and pass content types or native axios settings for one call.

## Call an operation

Each request part has its own key. A key only exists when the operation declares that part:

| Key       | Holds             | Example                              |
| --------- | ----------------- | ------------------------------------ |
| `path`    | Path parameters   | `path: { petId: 1 }`                 |
| `query`   | Query parameters  | `query: { status: 'available' }`     |
| `headers` | Header parameters | `headers: { 'X-Request-ID': 'r-1' }` |
| `cookies` | Cookie parameters | `cookies: { session_id: 'abc' }`     |
| `body`    | The request body  | `body: { name: 'Rex' }`              |

```typescript
import { getPetById } from './gen/clients/getPetById'
import { updatePet } from './gen/clients/updatePet'

const { data } = await getPetById({ path: { petId: 1 } })
//      ^ the parsed pet, typed from the 200 response

await updatePet({ path: { petId: 1 }, headers: { 'X-Request-ID': 'r-1' }, body: { name: 'Rex', status: 'sold' } })
```

An operation without required parameters takes no argument: `getStatus()`.

> [!NOTE]
> The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id is a `number`. With the default `bigint`, pass `1n`.

Path keys keep the spec's names, so `{pet-id}` is passed as `path: { 'pet-id': 1 }`. Set [`pathParamsCasing: 'camelcase'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing) on the adapter (`@kubb/adapter-oas` 5.20.0 or later) to pass `path: { petId: 1 }`. The HTTP request stays the same.

## Read the result

A call resolves to a `RequestResult`, a union narrowed by the numeric `status`:

```typescript
type RequestResult = {
  status: number
  data: TData // the parsed success body, undefined on an error result
  error: TError // the parsed error body, undefined on a success result
  contentType: string | undefined // the response media type, without parameters
  headers: Headers // the response headers
  request: AxiosRequestConfig // the native request config
  response: AxiosResponse // the native response
}
```

With `throwOnError: true`, the default, a resolved call is always a success. When an operation documents several success statuses, narrow on `status`. For a response that declares headers, `headers.get` suggests their names:

```typescript
const result = await getPetById({ path: { petId: 1 } })

console.info(result.headers.get('x-ratelimit-remaining'))
if (result.status === 200) console.info(result.data)
```

[Handle errors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/error-handling) covers `throwOnError: false`.

## Unwrap the success body

Call `.unwrap()` to get the success body without the result around it:

```typescript
const pet = await getPetById({ path: { petId: 1 } }).unwrap()
//    ^ the parsed pet
```

| `throwOnError`   | A non-2xx response makes `.unwrap()`              |
| ---------------- | ------------------------------------------------- |
| `true` (default) | throw a `ResponseError`, as a plain `await` does. |
| `false`          | reject with the parsed error body.                |

To get the body from every call, set [`returnType: 'data'`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#returntype) on the plugin.

## Set the content type

An operation with one request content type has it built in. When it accepts or returns several, set `contentType` on the call:

::code-group

```typescript [Request only]
await uploadAvatar({ path: { petId: 1 }, body: avatarBlob, contentType: 'image/png' })
```

```typescript [Request and Accept]
await getPet({ path: { petId: 1 }, contentType: { request: 'application/json', response: 'application/xml' } })
```

::

A string sets the request `Content-Type`. The object form also sends `response` as the `Accept` header.

## Pass native axios options

Pass `options` for axios settings such as `timeout`, `proxy`, `maxRedirects`, `decompress`, or `onUploadProgress`:

```typescript
await getPetById({ path: { petId: 1 }, options: { timeout: 5_000 } })
```

Set `client.setConfig({ options })` for shared defaults. Per-call options win. Kubb keeps control of the URL, method, headers, body, and status handling, as [Use a custom transport](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/transport) lists.

## Build a URL without sending

`client.getUrl` builds a URL with the same base URL, path interpolation, and query serialization as a request:

```typescript
import { client } from './gen/.kubb/client'

const url = client.getUrl({ url: '/pets/{petId}', path: { petId: 1 }, query: { fields: 'name' } })
// https://petstore.swagger.io/v2/pets/1?fields=name
```
