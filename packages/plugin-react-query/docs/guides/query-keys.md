# TanStack Query keys

See the query key each generated React Query hook uses, invalidate or read the cache with it, and add your own prefix to the default key.

## The default query key

When you call `invalidateQueries`, `getQueryData`, or `setQueryData`, take the key from the `<operation>QueryKey` helper in each hook file. It builds `[{ url, params }, query, body]`:

::code-group

```typescript [Generated]
// src/gen/hooks/useGetPetById.ts
export const getPetByIdQueryKey = ({ path }: Omit<GetPetByIdOptions, 'headers'>) => [{ url: '/pet/:petId', params: path }] as const

// src/gen/hooks/useFindPetsByTags.ts
export const findPetsByTagsQueryKey = ({ query }: Omit<FindPetsByTagsOptions, 'headers'> = {}) =>
  [{ url: '/pet/findByTags' }, ...(query ? [query] : [])] as const
```

```typescript [Usage]
import { getPetByIdQueryKey } from './gen/hooks/useGetPetById'
import { findPetsByTagsQueryKey } from './gen/hooks/useFindPetsByTags'
import { queryClient } from './queryClient'

getPetByIdQueryKey({ path: { petId: 1 } }) // [{ url: '/pet/:petId', params: { petId: 1 } }]
findPetsByTagsQueryKey({ query: { tags: ['dog'] } }) // [{ url: '/pet/findByTags' }, { tags: ['dog'] }]

const pet = queryClient.getQueryData(getPetByIdQueryKey({ path: { petId: 1 } }))
```

::

- `url` is the spec path with `:name` placeholders, such as `'/pet/:petId'`.
- `params` holds the path parameters, when the path has any.
- `query` and `body` follow when the operation has them and the call passes them.
- Headers and cookies stay out of the default key. A custom `queryKey` transformer can include the generated `headers` binding.
- Infinite variants add `infinite: true` to the first entry, so they never share a cache entry with the plain query.
- Each hook returns the key it used as `queryKey` on its result.

## Invalidate every call of an operation

TanStack Query matches a key by its prefix, and an object entry by the fields you pass. A key built without `query` matches every cached call of that operation with the same path parameters, infinite ones included:

```typescript
queryClient.invalidateQueries({ queryKey: findPetsByTagsQueryKey() })
```

## Mutation keys

Each mutation gets a `<operation>MutationKey` helper that returns `[{ url }]`, for filters such as `useIsMutating` or `useMutationState`:

::code-group

```typescript [Generated]
// src/gen/hooks/useUpdatePet.ts
export const updatePetMutationKey = () => [{ url: '/pet' }] as const
```

```typescript [Usage]
import { useIsMutating } from '@tanstack/react-query'
import { updatePetMutationKey } from './gen/hooks/useUpdatePet'

const saving = useIsMutating({ mutationKey: updatePetMutationKey() })
```

::

## Extend the default key

When you need your own entry, such as an API version, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#querykey) and spread `queryKeyTransformer`. Do not read single entries of its result: they can change between releases.

> [!WARNING]
> Returned strings are copied into the generated code as written. Wrap a string literal in `JSON.stringify(...)`.

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery, queryKeyTransformer } from '@kubb/plugin-react-query'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginFetch(),
    pluginReactQuery({
      queryKey: (props) => [JSON.stringify('v2'), ...queryKeyTransformer(props)],
    }),
  ],
})
```

```typescript [Generated]
export const getPetByIdQueryKey = ({ path }: Omit<GetPetByIdOptions, 'headers'>) => ["v2", { url: '/pet/:petId', params: path }] as const
```

::

The builder also gets the `variant`, so it can return a different key for suspense or infinite hooks. [`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#mutationkey) works the same way with `mutationKeyTransformer`.

Next, [generate infinite queries](https://kubb.dev/extensions/kubb-labs/plugin-react-query/guides/infinite-queries) for paginated endpoints.
