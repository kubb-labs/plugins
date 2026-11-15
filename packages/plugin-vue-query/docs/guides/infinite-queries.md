# Infinite queries with useInfiniteQuery

Generate `useInfiniteQuery` composables for paginated endpoints, read the next cursor from the response, and stop once the last page arrives.

## Generate infinite composables

When an endpoint pages through results with a query parameter, set [`infinite`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#infinite) next to `hooks: true`. Only operations that declare `infinite.queryParam` get an infinite composable, and the composable sends each page param as that parameter:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginVueQuery } from '@kubb/plugin-vue-query'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginFetch(),
    pluginVueQuery({
      hooks: true,
      infinite: { queryParam: 'page', initialPageParam: 0, nextParam: 'pagination.next.cursor' },
    }),
  ],
})
```

```typescript [Generated]
// src/gen/hooks/useFindPetsByTagsInfinite.ts, types left out
export const findPetsByTagsInfiniteQueryKey = ({ query }: { query?: MaybeRefOrGetter<Omit<FindPetsByTagsOptions, 'headers'>['query']> } = {}) =>
  [{ url: '/pet/findByTags', infinite: true }, ...(query ? [query] : [])] as const

export function findPetsByTagsInfiniteQueryOptions({ query }: { query?: MaybeRefOrGetter<FindPetsByTagsOptions['query']> } = {}, config = {}) {
  const queryKey = findPetsByTagsInfiniteQueryKey({ query })
  return infiniteQueryOptions({
    queryKey,
    queryFn: async ({ signal, pageParam }) => {
      return findPetsByTags({ ...config, query: { ...toValue(query), page: pageParam }, signal: config.signal ?? signal, throwOnError: true }).unwrap()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.['pagination']?.['next']?.['cursor'],
  })
}
```

```typescript [Usage]
import { ref } from 'vue'
import { useFindPetsByTagsInfinite } from './gen/hooks/useFindPetsByTagsInfinite'

const tags = ref(['dog'])
const { data, fetchNextPage, hasNextPage } = useFindPetsByTagsInfinite({ query: () => ({ tags: tags.value }) })
```

::

- Give `initialPageParam` the type of the query parameter.
- The infinite key adds `infinite: true`, so it never shares a cache entry with the plain query. See [TanStack Query keys](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/guides/query-keys).
- A ref or getter in `query` updates the key, so a change starts again from the first page.

## Read the next page from the response

The generated `getNextPageParam` comes from the first of these options you set:

| Option                                                                                                        | Generated `getNextPageParam`                                                                |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`getNextPageParam`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#infinitegetnextpageparam) | Your function's source, copied as written. It cannot use variables from the config file.    |
| [`nextParam`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#infinitenextparam)               | Reads that path on the last page, such as `lastPage?.['pagination']?.['next']?.['cursor']`. |
| [`cursorParam`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#infinitecursorparam)           | Deprecated. Reads that top-level field.                                                     |
| None                                                                                                          | Counts pages up from `initialPageParam` until a page is an empty array.                     |

`getPreviousPageParam`, `previousParam`, and `cursorParam` set the previous page in the same order. With [`returnType: 'full'`](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#returntype), the `nextParam` and `cursorParam` accessors read from `lastPage.data`.

## hasNextPage never turns false

Generation prints this warning for the operation:

```text
findPetsByTags: the default infinite page params expect an array response and never end for this one. Set `infinite.getNextPageParam` (or `nextParam`) to read the next page from the response.
```

Without `getNextPageParam`, `nextParam`, or `cursorParam`, the composable counts pages up from `initialPageParam` until a page is an empty array. That works only for array responses, so generation warns for any other response. It skips the warning when `previousParam` or `getPreviousPageParam` is set, though the count still never ends.

To fix it, set `nextParam` to the cursor path, or `getNextPageParam` when you must compute the next page.

Next, see every [`infinite` option](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/options#infinite), including `definePageParam` for a typed `getNextPageParam`.
