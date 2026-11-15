# Call operations

Use the generated TanStack Query composables and factories in Vue: queries, mutations, and infinite lists with reactive parameters.

Each one calls the function of your client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`).

## What each plugin generates

Each hook and its helpers live in a file named after the hook, such as `src/gen/hooks/useGetPetById.ts`. The three query plugins generate these exports:

| Operation                                   | React Query                                                                                         | Vue Query                                                                         | SWR                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Query (`GET`, `QUERY`)                      | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, plus `useGetPetById` with `hooks`                   | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, plus `useGetPetById` with `hooks` | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, `useGetPetById` |
| Mutation (`POST`, `PUT`, `PATCH`, `DELETE`) | `updatePetMutationKey`, `updatePetMutationOptions`, plus `useUpdatePet` with `hooks`                | `updatePetMutationKey`, plus `useUpdatePet` with `hooks`                          | `updatePetMutationKey`, `useUpdatePet`                          |
| Infinite, with `infinite` and `hooks`       | `findPetsByTagsInfiniteQueryKey`, `findPetsByTagsInfiniteQueryOptions`, `useFindPetsByTagsInfinite` | Same as React Query                                                               | Not generated                                                   |
| Suspense, with `suspense` and `hooks`       | `useGetPetByIdSuspense`, and `useFindPetsByTagsSuspenseInfinite` when `infinite` is set too         | Not generated                                                                     | Not generated                                                   |
| Server-Sent Events or JSON Lines            | Nothing. Call the client function directly.                                                         | Nothing                                                                           | Nothing                                                         |

## Call a composable

The examples set `hooks: true` on the plugin and [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id such as `petId` is a `number`. Path keys keep the names from the spec unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing).

::tabs

:::tabs-item{label="Query"}

The first argument holds the request groups the operation declares: `path`, `query`, `headers`. Each group takes a value, a ref, or a getter. The second argument takes `query`, any TanStack Query option plus `query.client` for the `QueryClient`, and `client`, request config for this call such as `baseURL`.

```typescript
import { useFindPetsByTags } from './gen/hooks/useFindPetsByTags'

const { data, error, isLoading } = useFindPetsByTags(
  { query: { tags: ['dog'] } },
  { query: { staleTime: 60_000 }, client: { baseURL: 'https://api.example.com/v1' } },
)
```

:::

:::tabs-item{label="Mutation"}

A mutation composable takes only the options object, with `mutation` and `client`. Pass the request groups to `mutate` or `mutateAsync`.

```typescript
import { useQueryClient } from '@tanstack/vue-query'
import { useUpdatePetWithForm } from './gen/hooks/useUpdatePetWithForm'

const queryClient = useQueryClient()
const { mutate } = useUpdatePetWithForm({
  mutation: { onSuccess: () => queryClient.invalidateQueries() },
})

mutate({ path: { petId: 1 }, query: { name: 'Fluffy' } })
```

:::

:::tabs-item{label="Infinite"}

Only operations that declare `infinite.queryParam` get an infinite composable. Point `nextParam` at the cursor in the response, and give `initialPageParam` the type of the query parameter.

```typescript [kubb.config.ts]
pluginVueQuery({
  hooks: true,
  infinite: { queryParam: 'page', initialPageParam: 0, nextParam: 'pagination.next.cursor' },
})
```

```typescript
import { useFindPetsByTagsInfinite } from './gen/hooks/useFindPetsByTagsInfinite'

const { data, fetchNextPage, hasNextPage } = useFindPetsByTagsInfinite({ query: () => ({ tags: ['dog'] }) })
```

:::

::

## Refetch when parameters change

Pass a ref or a getter instead of a value. A getter tracks its reactive dependencies, so a change updates the query key and fetches again:

```typescript
import { ref } from 'vue'
import { useFindPetsByTags } from './gen/hooks/useFindPetsByTags'

const tags = ref(['dog'])
const { data } = useFindPetsByTags({ query: () => ({ tags: tags.value }) })

tags.value = ['cat'] // fetches the cat list
```

## Prefetch and invalidate

The factories work without `hooks`, so you can prefetch or invalidate outside a component. The default key is the operation URL and path parameters, then the query or body values:

```typescript
import { findPetsByTagsQueryKey, findPetsByTagsQueryOptions } from './gen/hooks/useFindPetsByTags'
import { queryClient } from './queryClient' // the QueryClient you pass to VueQueryPlugin

await queryClient.prefetchQuery(findPetsByTagsQueryOptions({ query: { tags: ['dog'] } }))
queryClient.invalidateQueries({ queryKey: findPetsByTagsQueryKey({ query: { tags: ['dog'] } }) })
```

To change the keys, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#querykey) and [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#mutationkey).

## Errors

Each composable calls the client function with `throwOnError: true`, so a failed request sets TanStack Query's `error`, typed from the error responses in the spec. Set the base URL, auth, interceptors, and validation on the client plugin: see the [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios) guides, or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).
