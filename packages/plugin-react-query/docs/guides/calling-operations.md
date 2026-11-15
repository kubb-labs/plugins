# Call operations

Use the generated TanStack Query hooks and factories in React: queries, mutations, infinite lists, and suspense. Each one calls the function of your client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`).

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

The examples set `hooks: true` and [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id such as `petId` is a `number`. Path keys keep the names from the spec unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing).

::tabs

:::tabs-item{label="Query"}

The first argument holds the request groups the operation declares: `path`, `query`, `headers`. The second takes `query`, any TanStack Query option plus `query.client` for the `QueryClient`, and `client`, request config for this call such as `baseURL` or `signal`.

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data, error, isLoading } = useGetPetById(
  { path: { petId: 1 } },
  { query: { staleTime: 60_000 }, client: { baseURL: 'https://api.example.com/v1' } },
)
```

:::

:::tabs-item{label="Mutation"}

A mutation hook takes only the options object, with `mutation` and `client`. Pass the request groups to `mutate` or `mutateAsync`.

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { useDeletePet } from './gen/hooks/useDeletePet'

const queryClient = useQueryClient()
const { mutate } = useDeletePet({
  mutation: { onSuccess: () => queryClient.invalidateQueries() },
})

mutate({ path: { petId: 1 } })
```

:::

:::tabs-item{label="Infinite"}

Only operations that declare `infinite.queryParam` get an infinite hook. Point `nextParam` at the cursor in the response, and give `initialPageParam` the type of the query parameter.

```typescript [kubb.config.ts]
pluginReactQuery({
  hooks: true,
  infinite: { queryParam: 'page', initialPageParam: 0, nextParam: 'pagination.next.cursor' },
})
```

```typescript
import { useFindPetsByTagsInfinite } from './gen/hooks/useFindPetsByTagsInfinite'

const { data, fetchNextPage, hasNextPage } = useFindPetsByTagsInfinite({ query: { tags: ['dog'] } })
```

:::

:::tabs-item{label="Suspense"}

Set `suspense: {}` next to `hooks: true`. A suspense hook takes the same arguments as the query hook.

```typescript
import { useGetPetByIdSuspense } from './gen/hooks/useGetPetByIdSuspense'

const { data } = useGetPetByIdSuspense({ path: { petId: 1 } })
```

:::

::

## Prefetch and invalidate

The factories work without `hooks`, so you can prefetch or invalidate outside a component. The default key is the operation URL and path parameters, then the query or body values:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { getPetByIdQueryKey, getPetByIdQueryOptions } from './gen/hooks/useGetPetById'

const queryClient = useQueryClient()

await queryClient.prefetchQuery(getPetByIdQueryOptions({ path: { petId: 1 } }))
queryClient.invalidateQueries({ queryKey: getPetByIdQueryKey({ path: { petId: 1 } }) })
```

To change the keys, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#querykey) and [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#mutationkey). To give every hook shared options, set [`customOptions`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#customoptions).

## Errors

Each hook calls the client function with `throwOnError: true`, so a failed request sets TanStack Query's `error`, typed from the error responses in the spec. Set the base URL, auth, interceptors, and validation on the client plugin: see the [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios) guides, or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).
