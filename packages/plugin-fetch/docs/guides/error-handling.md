# Handle errors

Handle failures from the client Kubb generates. Catch a `ResponseError`, switch to a returned error result with `throwOnError`, and tell a network failure apart from a 4xx or 5xx response.

The generated client throws a `ResponseError` on non-2xx responses by default:

```typescript
import { getPetById } from './gen/clients/getPetById'
import { ResponseError } from './gen/.kubb/client'

try {
  const { data } = await getPetById({ path: { petId: 1 } })
  console.info(data.name)
} catch (error) {
  if (ResponseError.is(error)) {
    console.error(error.status) // 404
    console.error(error.data) // the parsed error body
  }
}
```

The `message` holds the HTTP method and the URL without its query string, so query credentials stay out of logs. For example: `GET https://api.example.com/pets/1 failed with status 404 Not Found`.

The error exposes these fields:

```typescript
class ResponseError extends Error {
  static is(error: unknown): error is ResponseError<unknown, unknown, unknown>
  data: TError // the parsed error body
  status: number
  statusText: string
  contentType: string | undefined
  request: Request
  response: Response
}
```

Each generated package bundles its own `ResponseError` class, so narrow with `ResponseError.is(error)` instead of `instanceof`. `is()` checks the error name.

## Return the error instead

Pass `throwOnError: false` and the call resolves for every documented status. The result is a
discriminated union: `data` is set on success and `error` on failure. A failed call with an empty
body sets `error` to `{ status, statusText }`.

Check `data` before you read it. A check on `status` narrows `data` too, unless the operation
declares a `default` response, whose status can be any number:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.data !== undefined) {
  console.info(result.data.name)
} else {
  console.error(result.status, result.error)
}
```

## Set the generated default

Set `throwOnErrorDefault` on the client plugin to choose how generated operations handle non-2xx
responses by default. Each call can still override that setting with `throwOnError`:

```typescript
import { pluginFetch } from '@kubb/plugin-fetch'

pluginFetch({ throwOnErrorDefault: false })

// resolves with an error result
const list = await searchPets({ query: { status: 'available' } })

// opt one call back into throwing
const pet = await getPetById({ path: { petId: 1 }, throwOnError: true })
```

`client.setConfig({ throwOnError })` does not change this default, because each generated
operation passes its own value. Set it on the plugin.

## Network failures still throw

> [!IMPORTANT]
> `throwOnError` only applies when the server answers. A dropped connection, a DNS failure, or an
> aborted `AbortSignal` always rejects. A `ResponseError` means the server answered with a non-2xx
> status, and a `ParseError` means a body failed validation. Any other error usually means the
> request never completed.

```typescript
try {
  const { data } = await getPetById({ path: { petId: 1 }, throwOnError: false })
  use(data)
} catch (error) {
  // not a ResponseError: the request never completed
  console.error('request failed to send', error)
}
```

Pass an `AbortSignal` to cancel a request. The call rejects with the abort reason.

## Validation failures

When you turn on the `validator` option, a body that does not match its Zod schema throws a
`ParseError` instead of returning. It carries the schema's raw `issues`:

```typescript
import { ParseError } from './gen/.kubb/standardSchema'

try {
  const { data } = await getPetById({ path: { petId: 1 } })
  use(data)
} catch (error) {
  if (error instanceof ParseError) {
    console.error(error.issues) // [{ message, path }]
  }
}
```

A `ParseError` reports schema validation issues. A `ResponseError` reports a non-2xx status. With `throwOnError: false`, the error body is checked against the error schema when the document declares its status. A status the document leaves out, such as a `502` from a gateway, resolves with the body unchecked. A `default` response declares every status.

Calling `.unwrap()` on a `throwOnError: false` call turns that same `error` into a rejection, so a
`try`/`catch` works there too.

## Turn validation off at runtime

The `validator` option decides at generation time which schemas each call carries. Set `validate` on the client to skip them at runtime, for example in production or in tests with partial fixtures:

```typescript
import { client } from './gen/.kubb/client'

client.setConfig({ validate: import.meta.env.DEV })
```

`validate: false` skips every schema. An object skips only the directions set to `false`: `request` (the body), `params` (path, query, and header params), `response`, and `error`:

```typescript
client.setConfig({ validate: { response: false } })
```

A per-call `validate` overrides the client setting, such as `getPetById({ path: { petId: 1 }, validate: true })`. The default is `true`.
