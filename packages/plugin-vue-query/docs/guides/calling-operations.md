# Call operations

`@kubb/plugin-vue-query` can generate a typed TanStack Query composable for each operation. `GET` operations get query composables such as `useGetPetById`, and `POST`, `PUT`, `PATCH`, and `DELETE` operations get mutation composables such as `useUpdatePetWithForm`. Each composable calls the client function from `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`.

> [!IMPORTANT]
> By default the plugin emits only the factory helpers (`queryOptions`, `queryKey`, `mutationKey`). Set [`hooks: true`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#hooks) in the plugin options to also generate the `use*` composables shown below.

## Queries

A query composable takes grouped request parameters as its first argument. Parameters accept a value, ref, or getter. See [reactive parameters](#refetch-when-parameters-change).

```typescript [usage.ts]
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data, error, isLoading } = useGetPetById({ path: { petId: 1n } })
```

The second argument has two optional groups. `query` takes any TanStack Query option, and `query.client` sets the `QueryClient` to use. The top-level `client` takes request config for this call, such as `baseURL`:

```typescript
import { useFindPetsByTags } from './gen/hooks/useFindPetsByTags'

useFindPetsByTags(
  { query: { tags: ['dog'] } },
  {
    query: { staleTime: 60_000 },
    client: { baseURL: 'https://api.example.com/v1' },
  },
)
```

## Factories

Every query operation also exports a `queryOptions` factory and a `queryKey` helper for prefetching and invalidation. The key is `[{ url }, query]`, built from the operation path and its query params:

```typescript
import { useQueryClient } from '@tanstack/vue-query'
import { findPetsByTagsQueryKey, findPetsByTagsQueryOptions } from './gen/hooks/useFindPetsByTags'

const queryClient = useQueryClient()

await queryClient.prefetchQuery(findPetsByTagsQueryOptions({ query: { tags: ['dog'] } }))
queryClient.invalidateQueries({ queryKey: findPetsByTagsQueryKey({ query: { tags: ['dog'] } }) })
```

Mutations export a `mutationKey` helper next to the composable.

## Mutations

A mutation composable takes only an options object. The grouped request config is the mutation variable, so you pass it to `mutate` or `mutateAsync`:

```typescript
import { useQueryClient } from '@tanstack/vue-query'
import { useUpdatePetWithForm } from './gen/hooks/useUpdatePetWithForm'

const queryClient = useQueryClient()

const { mutate } = useUpdatePetWithForm({
  mutation: { onSuccess: () => queryClient.invalidateQueries() },
})

mutate({ path: { petId: 1n }, query: { name: 'Fluffy' } })
```

## Errors and transport

Each generated composable calls the client function with `throwOnError: true`. A failed request sets TanStack Query's `error`, typed from the error responses in the spec. Set the base URL, authentication, interceptors, serialization, and validation on the client plugin. See the [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios) guide, or your own module with [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client).

## Customize cache keys

Set `queryKey` on the plugin to change generated keys. String entries are emitted as source code, so use `JSON.stringify` for a string literal.

```typescript [kubb.config.ts]
import { pluginVueQuery } from '@kubb/plugin-vue-query'

pluginVueQuery({
  queryKey: ({ node }) => [JSON.stringify(node.operationId)],
})
```

> [!WARNING]
> This `queryKey` gives every call the same key, such as `['getUserByName']`. If path or query values select different data, add them to the key.

## Load more pages

Configure `infinite` with a query parameter declared by the operation, its initial value, and the response path for the next cursor. Infinite output needs `hooks: true`, and only operations that declare the `queryParam` receive it.

::code-group

```typescript [kubb.config.ts]
import { pluginVueQuery } from '@kubb/plugin-vue-query'

pluginVueQuery({
  hooks: true,
  infinite: {
    queryParam: 'page',
    initialPageParam: 0,
    nextParam: 'pagination.next.cursor',
  },
})
```

```typescript [usage.ts]
import { useInfiniteQuery } from '@tanstack/vue-query'
import { findPetsByTagsInfiniteQueryOptions } from './gen/hooks/useFindPetsByTagsInfinite'

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  findPetsByTagsInfiniteQueryOptions({ query: () => ({ tags: ['dog'] }) }),
)
```

::

`nextParam` takes dot notation or an array of keys. Change it to match your API's response. Without `getNextPageParam`, `nextParam` or `cursorParam`, the generated options increment the page number until a page returns an empty array.

## Refetch when parameters change

Enable `hooks: true`, then pass a ref or getter to a generated composable. Parameters accept `MaybeRefOrGetter`. A getter tracks its reactive dependencies.

```typescript [usage.ts]
import { ref } from 'vue'
import { useFindPetsByTags } from './gen/hooks/useFindPetsByTags'

const tags = ref(['dog'])
const { data, error, isLoading } = useFindPetsByTags({
  query: () => ({ tags: tags.value }),
})

tags.value = ['cat']
```

Changing `tags.value` updates the query key and fetches the corresponding resource.
