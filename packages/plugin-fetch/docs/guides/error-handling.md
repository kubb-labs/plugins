# Handle errors

Catch a `ResponseError`, return errors as values with `throwOnError: false`, and tell a 4xx or 5xx answer apart from a request that never completed.

## What a call does

| What happens                             | `throwOnError: true` (default)             | `throwOnError: false`                      |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| 2xx response                             | Resolves with `data`.                      | Resolves with `data`.                      |
| Non-2xx response                         | Throws a `ResponseError`.                  | Resolves with `error` and `status`.        |
| A body fails its schema (`validator` on) | Throws a `ParseError`.                     | Throws a `ParseError`.                     |
| Invalid JSON under a JSON media type     | Throws a `ParseError`.                     | Throws a `ParseError`.                     |
| Network or DNS failure                   | Rejects with the `TypeError` from `fetch`. | Rejects with the `TypeError` from `fetch`. |
| Aborted `signal`                         | Rejects with the signal's reason.          | Rejects with the signal's reason.          |

Every failure that rejects also reaches [`client.interceptors.error`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/configure-requests#add-interceptors).

## Catch a ResponseError

```typescript
import { getPetById } from './gen/clients/getPetById'
import { ResponseError } from './gen/.kubb/client'

try {
  const { data } = await getPetById({ path: { petId: 1 } })
} catch (error) {
  if (ResponseError.is(error)) console.error(error.status, error.data) // 404, the parsed error body
}
```

Each generated package bundles its own `ResponseError` class, so narrow with `ResponseError.is(error)`, which checks the error name, instead of `instanceof`.

```typescript
class ResponseError extends Error {
  data: TError // the parsed error body
  status: number
  statusText: string
  contentType: string | undefined
  headers: Headers // such as error.headers.get('Retry-After')
  request: Request
  response: Response
}
```

The `message` names the method and the URL without its query string, so query credentials stay out of logs: `GET https://api.example.com/pets/1 failed with status 404 Not Found`.

## Narrow a thrown error by status

`isResponseError<Responses>(error)` narrows a caught error to one operation's `ResponseError`. A check on `status` then narrows `data` to that status's body:

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

A range key such as `4xx` covers its statuses that have no entry of their own, and `default` covers the rest. The type argument is not checked at runtime, so keep the `try` around one operation.

## Return the error instead

With `throwOnError: false`, the call resolves for every status. `data` is set on success and `error` on failure. A failed call with an empty body sets `error` to `{ status, statusText }`:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error !== undefined) console.error(result.status, result.error)
else console.info(result.data)
```

A check on `status` narrows `data` and `error` too, unless the operation declares a `default` response, whose status can be any number. `.unwrap()` on such a call turns `error` into a rejection.

## Set the generated default

[`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#throwonerrordefault) on the plugin sets what a call does when it leaves `throwOnError` out:

```typescript
pluginFetch({ throwOnErrorDefault: false })

const list = await searchPets({ query: { status: 'available' } }) // resolves with an error result
const pet = await getPetById({ path: { petId: 1 }, throwOnError: true }) // throws
```

`client.setConfig({ throwOnError })` does not change the default, because each generated function passes its own value.

## Validation failures

With [`validator`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator) on, a body that does not match its Zod schema throws a `ParseError` with the schema's `issues`:

```typescript
import { ParseError } from './gen/.kubb/standardSchema'

try {
  await getPetById({ path: { petId: 1 } })
} catch (error) {
  if (error instanceof ParseError) console.error(error.issues) // [{ message, path }]
}
```

The error body of a non-2xx response is checked against the schema of its status, then its range such as `5xx`, then `default`. A status the document leaves out keeps its body unchecked. An error body that fails its schema throws a `ParseError` instead of the `ResponseError`, also with `throwOnError: false`.

Pass `onValidationError` on the call or the client to recover. Return `{ value }` to use that value, or nothing to throw the `ParseError`:

```typescript
client.setConfig({
  onValidationError: (error, { direction, source, value }) => {
    console.warn(direction, source, error.issues)
    return { value }
  },
})
```

## Turn validation off at runtime

`validator` decides at generation time which schemas a call carries. `validate` skips them at runtime, for example in production or in tests with partial fixtures:

```typescript
client.setConfig({ validate: import.meta.env.DEV })
client.setConfig({ validate: { response: false } }) // skip one direction
```

`false` skips every schema. The object form skips the directions set to `false`: `request` (the body), `params`, `response`, and `error`. A per-call `validate` overrides the client. The default is `true`.
