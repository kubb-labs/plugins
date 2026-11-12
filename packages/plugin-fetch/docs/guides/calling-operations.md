# Call operations

The generated client accepts grouped request options on every operation and returns a typed `RequestResult` by default.

## Call an operation

Pass parameters under `path`, `query`, `headers`, `cookies`, or `body`, matching the OpenAPI operation.

```typescript
import { getPetById } from './gen/clients/getPetById'

const { data } = await getPetById({ path: { petId: 1n } })
//      ^ the parsed pet, typed from the 200 response
```

Query, header, and cookie parameters sit under their own keys, and a request body goes under
`body`:

```typescript
import { searchPets } from './gen/clients/searchPets'
import { updatePet } from './gen/clients/updatePet'

await searchPets({
  query: { status: 'available', category: 'dogs', limit: 10, offset: 0 },
})

await updatePet({
  path: { petId: '123' },
  headers: { 'X-Request-ID': 'req-123456' },
  body: { name: 'Updated name', status: 'sold' },
})
```

Each key only appears when the operation declares it. You can call an operation without required parameters with no argument: `getStatus()`.

## Read the result

A resolved call returns a `RequestResult` discriminated by the numeric `status`:

```typescript
type RequestResult = {
  status: number
  data: TData // the parsed success body, undefined on an error result
  error: TError // the parsed error body, undefined on a success result
  contentType: string | undefined // the negotiated response media type
  headers: Headers // the response headers
  request: Request // the native request
  response: Response // the native response
}
```

When `throwOnError` is `true` (the generated default), a resolved call is always a success, so you
read `data` straight away:

```typescript
const { data, status, response } = await getPetById({ path: { petId: 1n } })

console.info(status) // 200
console.info(response.headers.get('x-ratelimit-remaining'))
```

When an operation documents more than one success status, narrow on `status` to reach the body
for that case, and TypeScript follows the check:

```typescript
const result = await getPetById({ path: { petId: 1n } })

if (result.status === 200) {
  console.info(result.data)
}
```

## Unwrap the success body

Call `.unwrap()` to return the success body. Awaiting the operation directly returns the full result.

```typescript
import { getPetById } from './gen/clients/getPetById'

const pet = await getPetById({ path: { petId: 1n } }).unwrap()
//    ^ the parsed pet, not the full RequestResult
```

With `throwOnError: true`, a non-2xx response throws the same `ResponseError` a plain `await` would. With `throwOnError: false`, `.unwrap()` rejects with the parsed error body instead:

```typescript
try {
  const pet = await getPetById({ path: { petId: 1n }, throwOnError: false }).unwrap()
} catch (error) {
  // the parsed error body, not a ResponseError
  console.error(error)
}
```

## Set the content type

When an operation accepts or returns more than one media type, set `contentType` on the call. A
bare string sets the request content type. The object form also sends an `Accept` header for the
response:

```typescript
await uploadAvatar({
  path: { petId: '123' },
  body: avatarBlob,
  contentType: 'image/png',
})

await getPet({
  path: { petId: '123' },
  contentType: { request: 'application/json', response: 'application/xml' },
})
```

An operation that declares a single content type has it built in, so a multipart upload such as `uploadFile({ path: { petId: '123' }, body: { file: pngBlob } })` needs only the body.

## Pass native client options

Pass `options` on an operation for native fetch settings, such as `cache`, `mode`, `redirect`, `keepalive`, or `next`:

```typescript [src/app.ts]
import { getPetById } from './gen/clients/getPetById'

await getPetById({ path: { petId: 1n }, options: { cache: 'no-store' } })
```

Set `client.setConfig({ options })` for shared defaults. Per-call options take precedence. Kubb keeps control of serialization and HTTP error handling. See [Use a custom transport](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/transport).

## Build a URL without sending

Use `client.getUrl` to build a URL with the same base URL, path interpolation, and query serialization as a request:

```typescript
import { client } from './gen/.kubb/client'

const url = client.getUrl({
  url: '/pets/{petId}',
  path: { petId: 1 },
  query: { fields: 'name' },
})
// https://api.example.com/v1/pets/1?fields=name
```

## TRACE operations

Kubb generates a call for a `trace` operation, but `fetch` and ky reject the `TRACE` method. Use `@kubb/plugin-axios` or a custom transport for it.
