# Call operations

Use the generated TanStack Query hooks and factories in React: queries, mutations, infinite lists, and suspense.

## What each plugin generates

Each hook and its helpers live in a file named after the hook, such as `src/gen/hooks/useGetPetById.ts`.

| Operation                                   | Exports                                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Query (`GET`, `QUERY`)                      | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, plus `useGetPetById` with `hooks`                   |
| Mutation (`POST`, `PUT`, `PATCH`, `DELETE`) | `updatePetMutationKey`, `updatePetMutationOptions`, plus `useUpdatePet` with `hooks`                |
| Infinite, with `infinite` and `hooks`       | `findPetsByTagsInfiniteQueryKey`, `findPetsByTagsInfiniteQueryOptions`, `useFindPetsByTagsInfinite` |
| Suspense, with `suspense` and `hooks`       | `useGetPetByIdSuspense`, plus `useFindPetsByTagsSuspenseInfinite` with `infinite`                   |
| Server-Sent Events or JSON Lines            | Nothing. Call the client function directly.                                                         |

See [Compare the query plugins](EDGE:query-plugins-compared) for the Vue Query and SWR exports.

## Call a hook

The examples set `hooks: true`, and [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter so `petId` is a `number`. Path keys keep their spec names unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing).

::tabs

:::tabs-item{label="Query"}

The first argument takes the request groups: `path`, `query`, `headers`. The second takes TanStack Query options in `query`, with `query.client` for the `QueryClient`, and request config such as `baseURL` or `signal` in `client`.

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

The factories work without `hooks`, so you can prefetch or invalidate outside a component:

```typescript
import { getPetByIdQueryKey, getPetByIdQueryOptions } from './gen/hooks/useGetPetById'
import { queryClient } from './queryClient' // the QueryClient you pass to QueryClientProvider

await queryClient.prefetchQuery(getPetByIdQueryOptions({ path: { petId: 1 } }))
queryClient.invalidateQueries({ queryKey: getPetByIdQueryKey({ path: { petId: 1 } }) })
```

To change the keys, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#querykey) and [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#mutationkey). To share options across hooks, set [`customOptions`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#customoptions).

## Handle errors

Each hook calls the client with `throwOnError: true`, so a failed request sets TanStack Query's `error`, typed from the spec's error responses.

Next, set the base URL, auth, and interceptors on your client plugin: [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch), [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios), or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).
