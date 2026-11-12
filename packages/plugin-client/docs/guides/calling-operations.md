# Call operations

Each generated function takes one grouped options object and returns your client's promise.

```typescript
import { addPet, getPetById } from './gen/clients'

const created = await addPet({ body: { name: 'Odie', photoUrls: [] } })
console.log(created.data, created.response.status)

const pet = await getPetById({ path: { petId: 1 } })
```

The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id such as `petId` is a `number`. With the default it is a `bigint` and the call takes `1n`.

The keys are `path`, `query`, `headers`, `cookies`, and `body`. Kubb types each from the spec, so a wrong key or value fails at compile time.

## Errors

`throwOnError` defaults to `true` (see [`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#throwonerrordefault)). What that means is up to your client. With the [minimal client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#a-minimal-client), a non-2xx status throws, and `throwOnError: false` returns the error as a value:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error === undefined) {
  console.log('pet', result.data)
}
if (result.error !== undefined) {
  console.log('failed', result.response.status)
}
```

## Use a different client for one call

Pass `client` to send one call through another function:

```typescript
await getPetById({ path: { petId: 2 }, client: tenantClient })
```
