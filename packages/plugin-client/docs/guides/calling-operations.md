# Call operations

Call a generated function with one grouped options object. It returns your client's promise, so the result shape is the one your `RequestResult` type defines.

```typescript
import { addPet, getPetById } from './gen/clients'

const created = await addPet({ body: { name: 'Odie', photoUrls: [] } })
console.log(created.data, created.response.status)

const pet = await getPetById({ path: { petId: 1 } })
```

The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id such as `petId` is a `number`. With the default it is a `bigint` and the call takes `1n`.

| Key                                           | Holds                                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `path`, `query`, `headers`, `cookies`, `body` | The request values, typed from the spec. A wrong key or value fails at compile time.                                              |
| `throwOnError`                                | Overrides [`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#throwonerrordefault) for this call. |
| `client`                                      | Sends this call through another function, such as a signed or per-tenant client.                                                  |
| Any other key                                 | Passed to your client as is, such as `signal`.                                                                                    |

Path keys keep the names from the spec, so a `{pet-id}` placeholder is passed as `path: { 'pet-id': 1 }`. Set [`pathParamsCasing: 'camelcase'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing) on the adapter (`@kubb/adapter-oas` 5.20.0 or later) to pass `path: { petId: 1 }` instead. The HTTP request stays the same.

## Errors

What `throwOnError` does is up to your client. With the [client from scratch](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#write-the-client), a non-2xx status throws by default, and `throwOnError: false` returns the error as a value:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error === undefined) console.log('pet', result.data)
else console.log('failed', result.response.status)
```

## Use another client for one call

```typescript
await getPetById({ path: { petId: 2 }, client: tenantClient })
```

The passed `client` replaces the default for that call only.
