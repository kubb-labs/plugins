# Call operations

`@kubb/plugin-swr` generates a typed SWR hook for each operation. `GET` operations get `useSWR` hooks such as `useGetPetById`, and `POST`, `PUT`, `PATCH`, and `DELETE` operations get `useSWRMutation` hooks such as `useCreatePet`. Each hook calls the client function from `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`.

## Queries

A query hook takes the operation's grouped request config (`path`, `query`, `headers`, whichever the operation declares) as its first argument:

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data, error, isLoading } = useGetPetById({ path: { petId: 1n } })
```

The second argument takes `query` (any `SWRConfiguration`), `client` (request config for this call, such as `baseURL`), and the Kubb options `shouldFetch` and `immutable`, covered in [Skip requests until ready](#skip-requests-until-ready) and [Fetch immutable data](#fetch-immutable-data):

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

useGetPetById(
  { path: { petId: 1n } },
  {
    query: { refreshInterval: 30_000 },
    client: { baseURL: 'https://api.example.com/v1' },
  },
)
```

The exported `queryKey` helper includes the operation URL and request parameters. Pass it to SWR's `mutate` to update or revalidate that entry.

## Mutations

A mutation hook takes only an options object. Pass the grouped request config to `trigger(...)`:

```typescript
import { mutate } from 'swr'
import { useCreatePet } from './gen/hooks/useCreatePet'
import { getPetsQueryKey } from './gen/hooks/useGetPets'

const { trigger, isMutating } = useCreatePet({
  mutation: { onSuccess: () => mutate(getPetsQueryKey()) },
})

await trigger({ body: { name: 'Fluffy' } })
```

A `mutationKey` helper is exported next to the hook.

## Errors and transport

Each generated hook calls the client function with `throwOnError: true`. A failed request sets SWR's `error`, typed from the error responses in the spec. Set the base URL, authentication, interceptors, serialization, and validation on the client plugin. See the [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios) guide. With [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client), set these in your own client module.

## Skip requests until ready

Set `shouldFetch: false` to give SWR a `null` key and skip the request. Enable it once the required parameters are available. Mutation hooks accept the same switch, and a `null` key stops `trigger` from firing.

```typescript [usage.ts]
import { useGetPetById } from './gen/hooks/useGetPetById'

export function useSelectedPet(petId: bigint | undefined) {
  return useGetPetById(
    { path: { petId: petId ?? 0n } },
    { shouldFetch: petId != null },
  )
}
```

## Fetch immutable data

Set `immutable: true` on a query hook for data that stays unchanged. It sets `revalidateIfStale`, `revalidateOnFocus`, and `revalidateOnReconnect` to `false`.

```typescript [usage.ts]
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data, error } = useGetPetById(
  { path: { petId: 1n } },
  { immutable: true },
)
```

Options in `query` override these revalidation defaults.
