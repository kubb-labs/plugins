# Call operations

Use the generated TanStack Query composables and factories in Vue: queries, mutations, and infinite lists with reactive parameters.

## What each plugin generates

Each composable and its helpers live in a file named after the composable, such as `src/gen/hooks/useGetPetById.ts`.

| Operation                                   | Exports                                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Query (`GET`, `QUERY`)                      | `getPetByIdQueryKey`, `getPetByIdQueryOptions`, plus `useGetPetById` with `hooks`                   |
| Mutation (`POST`, `PUT`, `PATCH`, `DELETE`) | `updatePetMutationKey`, plus `useUpdatePet` with `hooks`                                            |
| Infinite, with `infinite` and `hooks`       | `findPetsByTagsInfiniteQueryKey`, `findPetsByTagsInfiniteQueryOptions`, `useFindPetsByTagsInfinite` |
| Server-Sent Events or JSON Lines            | Nothing. Call the client function directly.                                                         |

## Call a composable

The examples set `hooks: true`, and [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter so `petId` is a `number`. Path keys keep their spec names unless you set [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing).

::tabs

:::tabs-item{label="Query"}

The first argument takes the request groups (`path`, `query`, `headers`), each as a value, a ref, or a getter. The second takes TanStack Query options in `query`, with `query.client` for the `QueryClient`, and request config such as `baseURL` in `client`.

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

Only operations that declare `infinite.queryParam` get an infinite composable. Point `nextParam` at the cursor in the response, and give `initialPageParam` the type of the query parameter. See [Infinite queries](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/guides/infinite-queries).

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

Pass a ref or a getter instead of a value. A change updates the query key and fetches again:

```typescript
import { ref } from 'vue'
import { useFindPetsByTags } from './gen/hooks/useFindPetsByTags'

const tags = ref(['dog'])
const { data } = useFindPetsByTags({ query: () => ({ tags: tags.value }) })

tags.value = ['cat'] // fetches the cat list
```

## Prefetch and invalidate

The factories work without `hooks`, so you can prefetch or invalidate outside a component:

```typescript
import { findPetsByTagsQueryKey, findPetsByTagsQueryOptions } from './gen/hooks/useFindPetsByTags'
import { queryClient } from './queryClient' // the QueryClient you pass to VueQueryPlugin

await queryClient.prefetchQuery(findPetsByTagsQueryOptions({ query: { tags: ['dog'] } }))
queryClient.invalidateQueries({ queryKey: findPetsByTagsQueryKey({ query: { tags: ['dog'] } }) })
```

[TanStack Query keys](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/guides/query-keys) shows the default keys. To change them, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#querykey) and [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#mutationkey).

## Handle errors

Each composable calls the client with `throwOnError: true`, so a failed request sets TanStack Query's `error`, typed from the spec's error responses.

Next, set the base URL, auth, and interceptors on your client plugin: [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch), [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios), [plugin-ky](https://kubb.dev/extensions/kubb-labs/plugin-ky), or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).
