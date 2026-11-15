# Call operations

Use the generated `useSWR` and `useSWRMutation` hooks, and skip or freeze a request with the Kubb options. Each hook calls the function of your client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`).

## What each plugin generates

Each hook and its helpers live in a file named after the hook, such as `src/gen/hooks/useGetPetById.ts`. The three query plugins generate these exports:

| Operation                                   | React Query                                                                                         | Vue Query                                                                         | SWR                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Query (`GET`, `QUERY`)                      | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, plus `useGetPetById` with `hooks`                   | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, plus `useGetPetById` with `hooks` | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, `useGetPetById` |
| Mutation (`POST`, `PUT`, `PATCH`, `DELETE`) | `updatePetMutationKey`, `updatePetMutationOptions`, plus `useUpdatePet` with `hooks`                | `updatePetMutationKey`, plus `useUpdatePet` with `hooks`                          | `updatePetMutationKey`, `useUpdatePet`                          |
| Infinite, with `infinite` and `hooks`       | `findPetsByTagsInfiniteQueryKey`, `findPetsByTagsInfiniteQueryOptions`, `useFindPetsByTagsInfinite` | Same as React Query                                                               | Not generated                                                   |
| Suspense, with `suspense` and `hooks`       | `useGetPetByIdSuspense`, and `useFindPetsByTagsSuspenseInfinite` when `infinite` is set too         | Not generated                                                                     | Not generated                                                   |
| Server-Sent Events or JSON Lines            | Nothing. Call the client function directly.                                                         | Nothing                                                                           | Nothing                                                         |

## Call a hook

The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id such as `petId` is a `number`. Path keys keep the names from the spec unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing).

::tabs

:::tabs-item{label="Query"}

The first argument holds the request groups the operation declares: `path`, `query`, `headers`. The second takes `query`, any `SWRConfiguration`, `client`, request config for this call such as `baseURL`, and the Kubb options `shouldFetch` and `immutable`.

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

Pass a `queryKey` helper to SWR's `mutate` to update or revalidate that entry. The default key is the operation URL and path parameters, then the query or body values. To change it, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-swr/options#querykey) and [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-swr/options#mutationkey).

## Skip requests until ready

`shouldFetch: false` gives SWR a `null` key, so the request does not run. Pass `true` once the required parameters are there. Mutation hooks take the same option, and calling `trigger` with a `null` key throws a missing-key error.

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

## Errors

Each hook calls the client function with `throwOnError: true`, so a failed request sets SWR's `error`, typed from the error responses in the spec. Set the base URL, auth, interceptors, and validation on the client plugin: see the [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios) guides, or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).
