# Call operations

Use the generated `useSWR` and `useSWRMutation` hooks, and skip or freeze a request with the Kubb options.

## What each plugin generates

Each hook and its helpers live in a file named after the hook, such as `src/gen/hooks/useGetPetById.ts`.

| Operation                                   | Exports                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| Query (`GET`, `QUERY`)                      | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, `useGetPetById` |
| Mutation (`POST`, `PUT`, `PATCH`, `DELETE`) | `updatePetMutationKey`, `useUpdatePet`                          |
| Infinite or suspense                        | Not generated                                                   |
| Server-Sent Events or JSON Lines            | Nothing. Call the client function directly.                     |

## Call a hook

The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter so `petId` is a `number`. Path keys keep their spec names unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing).

::tabs

:::tabs-item{label="Query"}

The first argument takes the request groups: `path`, `query`, `headers`. The second takes SWR options (`SWRConfiguration`) in `query`, request config such as `baseURL` in `client`, and the Kubb options `shouldFetch` and `immutable`.

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data, error, isLoading } = useGetPetById(
  { path: { petId: 1 } },
  { query: { refreshInterval: 30_000 }, client: { baseURL: 'https://api.example.com/v1' } },
)
```

:::

:::tabs-item{label="Mutation"}

A mutation hook takes only the options object, with `mutation`, `client`, and `shouldFetch`. Pass the request groups to `trigger`.

```typescript
import { mutate } from 'swr'
import { useCreatePet } from './gen/hooks/useCreatePet'
import { getPetsQueryKey } from './gen/hooks/useGetPets'

const { trigger, isMutating } = useCreatePet({
  mutation: { onSuccess: () => mutate(getPetsQueryKey()) },
})

await trigger({ body: { name: 'Fluffy' } })
```

:::

::

Pass a `queryKey` helper to SWR's `mutate` to update or revalidate that entry. [SWR keys](https://kubb.dev/extensions/kubb-labs/plugin-swr/guides/query-keys) shows the default keys. To change them, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-swr/options#querykey) and [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-swr/options#mutationkey).

## Skip requests until ready

`shouldFetch: false` gives SWR a `null` key, so the request waits until you pass `true`. On a mutation hook, `shouldFetch: false` makes `trigger` throw a missing-key error.

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

export function useSelectedPet(petId: number | undefined) {
  return useGetPetById({ path: { petId: petId ?? 0 } }, { shouldFetch: petId != null })
}
```

## Fetch immutable data

`immutable: true` on a query hook sets `revalidateIfStale`, `revalidateOnFocus`, and `revalidateOnReconnect` to `false`. Options in `query` still win.

```typescript
const { data } = useGetPetById({ path: { petId: 1 } }, { immutable: true })
```

## Handle errors

Each hook calls the client with `throwOnError: true`, so a failed request sets SWR's `error`, typed from the spec's error responses.

Next, set the base URL, auth, and interceptors on your client plugin: [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch), [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios), or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).
