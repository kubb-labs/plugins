# Call operations

Call a generated function with one grouped options object. It returns your client's promise, shaped by your `RequestResult` type.

```typescript
import { addPet, getPetById } from './gen/clients'

const created = await addPet({ body: { name: 'Odie', photoUrls: [] } })
console.log(created.data, created.response.status)

const pet = await getPetById({ path: { petId: 1 } })
```

The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter. Without it, `petId` is a `bigint` and takes `1n`.

| Key                                           | Holds                                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `path`, `query`, `headers`, `cookies`, `body` | The request values, typed from the spec.                                                                                          |
| `throwOnError`                                | Overrides [`throwOnErrorDefault`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#throwonerrordefault) for this call. |
| `client`                                      | Another client function for this call, such as a signed or per-tenant client.                                                     |
| Any other key                                 | Passed to your client as is, such as `signal`.                                                                                    |

Path keys keep their spec names unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing). See [Path parameter names](EDGE:path-parameter-names).

## Handle errors

Your client decides what `throwOnError` does. With the [client from scratch](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#write-the-client), a non-2xx status throws, and `throwOnError: false` returns the error as a value:

```typescript
const result = await getPetById({ path: { petId: 1 }, throwOnError: false })

if (result.error === undefined) console.log('pet', result.data)
else console.log('failed', result.response.status)
```

Next, [validate requests and responses](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/validate-requests-and-responses).
