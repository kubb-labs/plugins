# Call operations

`@kubb/plugin-react-query` can generate a typed TanStack Query hook for each operation. `GET` operations get query hooks such as `useGetPetById`, and `POST`, `PUT`, `PATCH`, and `DELETE` operations get mutation hooks such as `useDeletePet`. Each hook calls the client function from `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`.

> [!IMPORTANT]
> By default the plugin emits only the factory helpers (`queryOptions`, `mutationOptions`, `queryKey`, `mutationKey`). Set [`hooks: true`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#hooks) in the plugin options to also generate the `use*` hooks shown below.

## Queries

A query hook takes the operation's grouped request config (`path`, `query`, `headers`, whichever the operation declares) as its first argument and returns a TanStack `UseQueryResult`:

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data, error, isLoading } = useGetPetById({ path: { petId: 1n } })
```

The second argument has two optional groups. `query` takes any TanStack Query option, and `query.client` sets the `QueryClient` to use. The top-level `client` takes request config for this call, such as `baseURL` or `signal`:

```typescript
import { useGetPetById } from './gen/hooks/useGetPetById'

useGetPetById(
  { path: { petId: 1n } },
  {
    query: { staleTime: 60_000 },
    client: { baseURL: 'https://api.example.com/v1' },
  },
)
```

## Factories

Each query operation also exports a `queryOptions` factory and a `queryKey` helper. Use them to prefetch or invalidate a query outside a hook. The key includes the operation URL and path parameters, followed by query or body values when present:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { getPetByIdQueryKey, getPetByIdQueryOptions } from './gen/hooks/useGetPetById'

const queryClient = useQueryClient()

await queryClient.prefetchQuery(getPetByIdQueryOptions({ path: { petId: 1n } }))
queryClient.invalidateQueries({ queryKey: getPetByIdQueryKey({ path: { petId: 1n } }) })
```

## Mutations

A mutation hook takes only an options object. The grouped request config is the mutation variable, so you pass it to `mutate` or `mutateAsync`:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { useDeletePet } from './gen/hooks/useDeletePet'

const queryClient = useQueryClient()

const { mutate } = useDeletePet({
  mutation: { onSuccess: () => queryClient.invalidateQueries() },
})

mutate({ path: { petId: 1n } })
```

Each mutation also exports a `mutationOptions` factory and a `mutationKey` helper.

## Errors and transport

Each generated hook calls the client function with `throwOnError: true`. A failed request sets TanStack Query's `error`, typed from the error responses in the spec. Set the base URL, authentication, interceptors, serialization, and validation on the client plugin. See the [plugin-fetch](https://kubb.dev/extensions/kubb-labs/plugin-fetch) or [plugin-axios](https://kubb.dev/extensions/kubb-labs/plugin-axios) guide. With [plugin-client](https://kubb.dev/extensions/kubb-labs/plugin-client), set these in your own client module.

## Customize cache keys

Set `queryKey` on the plugin to change generated keys. String entries are emitted as source code, so use `JSON.stringify` for a string literal.

```typescript [kubb.config.ts]
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({
  queryKey: ({ node }) => [JSON.stringify(node.operationId)],
})
```

> [!WARNING]
> This `queryKey` gives every call the same key, such as `['getUserByName']`. If path or query values select different data, add them to the key.

## Load more pages

Configure `infinite` with a query parameter declared by the operation, its initial value, and the response path for the next cursor. Infinite output needs `hooks: true`, and only operations that declare the `queryParam` receive it.

::code-group

```typescript [kubb.config.ts]
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({
  hooks: true,
  infinite: {
    queryParam: 'page',
    initialPageParam: 0,
    nextParam: 'pagination.next.cursor',
  },
})
```

```typescript [usage.ts]
import { useInfiniteQuery } from '@tanstack/react-query'
import { findPetsByTagsInfiniteQueryOptions } from './gen/hooks/useFindPetsByTagsInfinite'

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  findPetsByTagsInfiniteQueryOptions({ query: { tags: ['dog'] } }),
)
```

::

`nextParam` takes dot notation or an array of keys. Change it to match your API's response. Without `getNextPageParam`, `nextParam` or `cursorParam`, the generated options increment the page number until a page returns an empty array.

## Use suspense

Set `suspense: {}` and `hooks: true` to generate suspense hooks alongside regular hooks. Suspense requires TanStack Query v5 or higher.

::code-group

```typescript [kubb.config.ts]
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({ hooks: true, suspense: {} })
```

```typescript [usage.ts]
import { useGetPetByIdSuspense } from './gen/hooks/useGetPetByIdSuspense'

const { data } = useGetPetByIdSuspense({ path: { petId: 1n } })
```

::

## Share hook options

Set [`customOptions`](https://kubb.dev/extensions/kubb-labs/plugin-react-query/options#customoptions) to call one options function from every generated hook.

```typescript [kubb.config.ts]
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({
  hooks: true,
  customOptions: {
    importPath: './useCustomHookOptions',
    name: 'useCustomHookOptions',
  },
})
```

Create the function at `importPath`, resolved from the generated hooks folder (here `src/gen/hooks/useCustomHookOptions.ts`). Each hook passes `{ hookName, operationId }`. The generated barrel re-exports `HookOptions`.

```typescript [src/gen/hooks/useCustomHookOptions.ts]
import type { HookOptions } from './HookOptions'

export function useCustomHookOptions(
  { hookName }: { hookName: keyof HookOptions; operationId: string },
) {
  if (hookName === 'useGetPetById') {
    return { staleTime: 60_000 } satisfies HookOptions['useGetPetById']
  }
  return {}
}
```

Per-call query options override shared options.
