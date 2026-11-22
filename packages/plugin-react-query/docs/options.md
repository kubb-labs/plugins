# Options

Pass these options to `pluginReactQuery()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                  | Default                                                                                |
| ------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`client`](#client)                                                       | Client plugin the hooks call.                            | Auto-detected                                                                          |
| [`returnType`](#returntype)                                               | What the hooks resolve to.                               | `'data'`                                                                               |
| [`hooks`](#hooks)                                                         | Emit `use*` hooks on top of the factories.               | `false`                                                                                |
| [`query`](#query)                                                         | Which methods become queries, and the TanStack import.   | `{ methods: ['GET', 'QUERY'], importPath: '@tanstack/react-query' }`                   |
| [`query.methods`](#querymethods)                                          | Methods that become queries.                             | `['GET', 'QUERY']`                                                                     |
| [`query.importPath`](#queryimportpath)                                    | Import path of the query helpers.                        | `'@tanstack/react-query'`                                                              |
| [`queryKey`](#querykey)                                                   | Build the `queryKey` of each query.                      | `queryKeyTransformer`                                                                  |
| [`mutation`](#mutation)                                                   | Which methods become mutations, and the TanStack import. | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' }` |
| [`mutation.methods`](#mutationmethods)                                    | Methods that become mutations.                           | `['POST', 'PUT', 'PATCH', 'DELETE']`                                                   |
| [`mutation.importPath`](#mutationimportpath)                              | Import path of the mutation helpers.                     | `'@tanstack/react-query'`                                                              |
| [`mutationKey`](#mutationkey)                                             | Build the `mutationKey` of each mutation.                | `mutationKeyTransformer`                                                               |
| [`infinite`](#infinite)                                                   | Generate infinite queries for pagination.                | `false`                                                                                |
| [`infinite.queryParam`](#infinitequeryparam)                              | Query parameter for the page cursor.                     | `'id'`                                                                                 |
| [`infinite.initialPageParam`](#infiniteinitialpageparam)                  | First `pageParam`.                                       | `0`                                                                                    |
| [`infinite.nextParam`](#infinitenextparam)                                | Path to the next cursor.                                 | `null`                                                                                 |
| [`infinite.previousParam`](#infinitepreviousparam)                        | Path to the previous cursor.                             | `null`                                                                                 |
| [`infinite.getNextPageParam`](#infinitegetnextpageparam)                  | Compute the next page param.                             | `null`                                                                                 |
| [`infinite.getPreviousPageParam`](#infinitegetpreviouspageparam)          | Compute the previous page param.                         | `null`                                                                                 |
| [`infinite.cursorParam`](#infinitecursorparam)                            | Deprecated cursor field.                                 | `null`                                                                                 |
| [`suspense`](#suspense)                                                   | Generate `useSuspenseQuery` hooks.                       | `false`                                                                                |
| [`customOptions`](#customoptions)                                         | Route every hook through your own options function.      | None                                                                                   |
| [`customOptions.importPath`](#customoptionsimportpath)                    | Module of your function.                                 | None, required                                                                         |
| [`customOptions.name`](#customoptionsname)                                | Name of your function.                                   | `'useCustomHookOptions'`                                                               |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                 | `{ path: 'hooks', barrel: { type: 'named' } }`                                         |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                             | None                                                                                   |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                         | None                                                                                   |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                              | `[]`                                                                                   |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                     | `[]`                                                                                   |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                | `resolverReactQuery`                                                                   |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                       | `[]`                                                                                   |

## Option details

### client

The client plugin the hooks call. Kubb detects a lone client plugin, so set `client` only when several are registered. Generation fails when none is.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'fetch' \| 'axios' \| 'ky' \| 'client'` |
| Required | `false`                                  |

::field-group

:::field{name="'fetch'"}
Calls [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch).
:::

:::field{name="'axios'"}
Calls [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios).
:::

:::field{name="'ky'"}
Calls [`@kubb/plugin-ky`](https://kubb.dev/extensions/kubb-labs/plugin-ky).
:::

:::field{name="'client'"}
Calls [`@kubb/plugin-client`](https://kubb.dev/extensions/kubb-labs/plugin-client). Your client module must also export `RequestConfig` and `ResponseErrorConfig`.
:::

::

### returnType

What the hooks resolve to.

|          |                    |
| -------- | ------------------ |
| Type     | `'data' \| 'full'` |
| Required | `false`            |
| Default  | `'data'`           |

::field-group

:::field{name="'data'"}
Resolves to the success body.
:::

:::field{name="'full'"}
Resolves to the client's whole `RequestResult`, so a hook can read the status and headers. Needs a client plugin with `returnType` `'full'` or `'plain'`, or generation fails.
:::

::

```typescript
pluginReactQuery({ returnType: 'full' })

// with integerType: 'number' on the adapter
const { data: result } = useGetPetById({ path: { petId: 1 } })
const etag = result?.response.headers.get('ETag')
```

### hooks

Set `true` to generate `useQuery` and `useMutation` hooks on top of the `queryOptions`, `mutationOptions`, and key helpers. [Call operations](https://kubb.dev/extensions/kubb-labs/plugin-react-query/guides/calling-operations#what-each-plugin-generates) lists every export.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

### query

Which operations become queries and where TanStack Query is imported from. `false` skips query output.

|          |                                                                      |
| -------- | -------------------------------------------------------------------- |
| Type     | `Partial<Query> \| false`                                            |
| Required | `false`                                                              |
| Default  | `{ methods: ['GET', 'QUERY'], importPath: '@tanstack/react-query' }` |

#### query.methods

HTTP methods treated as queries. A method in neither list gets no helper, so keep `'QUERY'` when you replace it.

|          |                    |
| -------- | ------------------ |
| Type     | `Array<string>`    |
| Required | `false`            |
| Default  | `['GET', 'QUERY']` |

#### query.importPath

Module for `queryOptions`, `useQuery`, and their variants, such as a wrapper that sets a default `QueryClient`.

|          |                           |
| -------- | ------------------------- |
| Type     | `string`                  |
| Required | `false`                   |
| Default  | `'@tanstack/react-query'` |

### queryKey

Builds each query's `queryKey` from the operation `node` and the `variant`: `'query'`, `'suspenseQuery'`, `'infiniteQuery'`, or `'suspenseInfiniteQuery'`. The default key is `[{ url, params }, query, body]`.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `queryKeyTransformer`                                  |

> [!WARNING]
> Returned strings are copied into the generated code as written, so wrap a string literal in `JSON.stringify(...)`.

To extend the default, spread it. See [TanStack Query keys](https://kubb.dev/extensions/kubb-labs/plugin-react-query/guides/query-keys).

```typescript
import { queryKeyTransformer } from '@kubb/plugin-react-query'

queryKey: (props) => [JSON.stringify('v2'), ...queryKeyTransformer(props)]
```

The generated helper also accepts optional `headers` for operations with header parameters. To include them in the cache key, reference the `headers` binding:

```typescript
queryKey: (props) => [
  ...queryKeyTransformer(props),
  ...(props.node.parameters?.some((param) => param.in === 'header') ? ['...(headers ? [headers] : [])'] : []),
]
```

Headers stay out of the default key. Include only response-varying values that are safe to store in caches and devtools.

### mutation

Which operations become mutations and where TanStack Query is imported from. `false` skips mutation output.

|          |                                                                                        |
| -------- | -------------------------------------------------------------------------------------- |
| Type     | `Partial<Mutation> \| false`                                                           |
| Required | `false`                                                                                |
| Default  | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' }` |

#### mutation.methods

HTTP methods treated as mutations. A method also in `query.methods` stays a query.

|          |                                      |
| -------- | ------------------------------------ |
| Type     | `Array<string>`                      |
| Required | `false`                              |
| Default  | `['POST', 'PUT', 'PATCH', 'DELETE']` |

#### mutation.importPath

Module for `mutationOptions` and `useMutation`.

|          |                           |
| -------- | ------------------------- |
| Type     | `string`                  |
| Required | `false`                   |
| Default  | `'@tanstack/react-query'` |

### mutationKey

Builds each mutation's `mutationKey`, for batched invalidations or `useMutationState`. It works like [`queryKey`](#querykey) with `variant: 'mutation'`. The default key is `[{ url }]`.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `mutationKeyTransformer`                               |

```typescript
import { mutationKeyTransformer } from '@kubb/plugin-react-query'

mutationKey: (props) => [JSON.stringify('v2'), ...mutationKeyTransformer(props)]
```

### infinite

Adds `infiniteQueryOptions` and `useInfiniteQuery` to each query operation that takes the [`infinite.queryParam`](#infinitequeryparam) parameter. Needs [`hooks: true`](#hooks).

|          |                              |
| -------- | ---------------------------- |
| Type     | `Partial<Infinite> \| false` |
| Required | `false`                      |
| Default  | `false`                      |

> [!WARNING]
> Set `nextParam` or `getNextPageParam`. Otherwise `hasNextPage` never turns false for a non-array response. See [Infinite queries](https://kubb.dev/extensions/kubb-labs/plugin-react-query/guides/infinite-queries#hasnextpage-never-turns-false).

#### infinite.queryParam

Query parameter that carries the page cursor.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'id'`   |

#### infinite.initialPageParam

`pageParam` of the first fetch. Give it the type of the query parameter.

|          |           |
| -------- | --------- |
| Type     | `unknown` |
| Required | `false`   |
| Default  | `0`       |

#### infinite.nextParam

Path to the next cursor on the response, in dot notation (`'pagination.next.id'`) or array form (`['pagination', 'next', 'id']`).

|          |                                   |
| -------- | --------------------------------- |
| Type     | `string \| Array<string> \| null` |
| Required | `false`                           |
| Default  | `null`                            |

#### infinite.previousParam

Path to the previous cursor, in the same forms as `nextParam`.

|          |                                   |
| -------- | --------------------------------- |
| Type     | `string \| Array<string> \| null` |
| Required | `false`                           |
| Default  | `null`                            |

#### infinite.getNextPageParam

Source of TanStack Query's `getNextPageParam`, for a next page you must compute. Pass a string, a function, or `definePageParam`, which types the page and the page parameter.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `string \| PageParamFn \| null` |
| Required | `false`                         |
| Default  | `null`                          |

> [!NOTE]
> Only the function's source is copied, so it cannot use variables from the config file.

```typescript [kubb.config.ts]
import { definePageParam, pluginReactQuery } from '@kubb/plugin-react-query'

type PetsPage = { hasNext: boolean; number: number }

pluginReactQuery({
  hooks: true,
  infinite: {
    queryParam: 'page',
    getNextPageParam: definePageParam<PetsPage, number>((lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined)),
  },
})
```

#### infinite.getPreviousPageParam

Source of TanStack Query's `getPreviousPageParam`, in the same forms as `getNextPageParam`.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `string \| PageParamFn \| null` |
| Required | `false`                         |
| Default  | `null`                          |

#### infinite.cursorParam

Deprecated. Use `nextParam` and `previousParam`. A top-level response field, not a dot path, that holds the cursor for both directions.

|          |                  |
| -------- | ---------------- |
| Type     | `string \| null` |
| Required | `false`          |
| Default  | `null`           |

### suspense

Pass `{}` to add `useSuspenseQuery` hooks, plus `useSuspenseInfiniteQuery` when [`infinite`](#infinite) is set. Needs [`hooks: true`](#hooks).

|          |                   |
| -------- | ----------------- |
| Type     | `object \| false` |
| Required | `false`           |
| Default  | `false`           |

### customOptions

Calls one function of yours from every hook to share options such as `staleTime`. Kubb also writes a `HookOptions` type, keyed by hook name. Needs [`hooks: true`](#hooks).

|          |                                         |
| -------- | --------------------------------------- |
| Type     | `{ importPath: string; name?: string }` |
| Required | `false`                                 |

Each hook calls it with `{ hookName, operationId }`, and per-call options win over its result:

```typescript [src/gen/hooks/useCustomHookOptions.ts]
import type { HookOptions } from './HookOptions'

export function useCustomHookOptions({ hookName }: { hookName: keyof HookOptions; operationId: string }) {
  if (hookName === 'useGetPetById') {
    return { staleTime: 60_000 } satisfies HookOptions['useGetPetById']
  }
  return {}
}
```

#### customOptions.importPath

Module of the function, resolved from the generated hooks folder. If the path is inside the plugin's output folder and the file is missing, Kubb writes a starter file.

|          |                                    |
| -------- | ---------------------------------- |
| Type     | `string`                           |
| Required | `true` when `customOptions` is set |

#### customOptions.name

Exported name of the function.

|          |                          |
| -------- | ------------------------ |
| Type     | `string`                 |
| Required | `false`                  |
| Default  | `'useCustomHookOptions'` |

### resolver

Overrides generated names. Members you leave out keep `resolverReactQuery`. See [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) for the shared members. Pass an array to merge several patches over `resolverReactQuery`, left to right.

|          |                                     |
| -------- | ----------------------------------- |
| Type     | `ResolverInput<ResolverReactQuery>` |
| Required | `false`                             |

::code-collapse{name="ResolverReactQuery patch members"}

```typescript [Partial override]
type ResolverReactQueryPatch = {
  // plus the shared name, file, and imports members
  query?: {
    name?(node: OperationNode): string // 'useGetPetById'
    optionsName?(node: OperationNode): string // 'getPetByIdQueryOptions'
    keyName?(node: OperationNode): string // 'getPetByIdQueryKey'
    keyTypeName?(node: OperationNode): string // 'GetPetByIdQueryKey'
  }
  // same members, with a Suspense, Infinite, or SuspenseInfinite suffix
  suspenseQuery?: ResolverReactQueryPatch['query']
  infiniteQuery?: ResolverReactQueryPatch['query']
  suspenseInfiniteQuery?: ResolverReactQueryPatch['query']
  mutation?: {
    name?(node: OperationNode): string // 'useUpdatePet'
    optionsName?(node: OperationNode): string // 'updatePetMutationOptions'
    keyName?(node: OperationNode): string // 'updatePetMutationKey'
  }
  hook?: {
    optionsName?(): string // 'HookOptions'
    customOptionsName?(): string // 'getCustomHookOptions'
  }
}
```

::
