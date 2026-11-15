# Options

Pass these options to `pluginVueQuery()`. Rows for shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options) and give this plugin's default.

## Options overview

| Option                                                                    | Purpose                                                                | Default                                                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`client`](#client)                                                       | Which registered client plugin the composables call.                   | Auto-detected                                                                        |
| [`returnType`](#returntype)                                               | Shape of the value the composables resolve to.                         | `'data'`                                                                             |
| [`hooks`](#hooks)                                                         | Emit `use*` composables on top of the factories.                       | `false`                                                                              |
| [`query`](#query)                                                         | Which operations become queries, or `false` to skip them.              | `{ methods: ['GET', 'QUERY'], importPath: '@tanstack/vue-query' }`                   |
| [`query.methods`](#querymethods)                                          | HTTP methods treated as queries.                                       | `['GET', 'QUERY']`                                                                   |
| [`query.importPath`](#queryimportpath)                                    | Module the query helpers import TanStack Query from.                   | `'@tanstack/vue-query'`                                                              |
| [`queryKey`](#querykey)                                                   | Build the `queryKey` of each query.                                    | `queryKeyTransformer`                                                                |
| [`mutation`](#mutation)                                                   | Which operations become mutations, or `false` to skip them.            | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/vue-query' }` |
| [`mutation.methods`](#mutationmethods)                                    | HTTP methods treated as mutations.                                     | `['POST', 'PUT', 'PATCH', 'DELETE']`                                                 |
| [`mutation.importPath`](#mutationimportpath)                              | Module the mutation composables import TanStack Query from.            | `'@tanstack/vue-query'`                                                              |
| [`mutationKey`](#mutationkey)                                             | Build the `mutationKey` of each mutation.                              | `mutationKeyTransformer`                                                             |
| [`infinite`](#infinite)                                                   | Generate infinite queries for pagination.                              | `false`                                                                              |
| [`infinite.queryParam`](#infinitequeryparam)                              | Query parameter that carries the page cursor.                          | `'id'`                                                                               |
| [`infinite.initialPageParam`](#infiniteinitialpageparam)                  | `pageParam` of the first fetch.                                        | `0`                                                                                  |
| [`infinite.nextParam`](#infinitenextparam)                                | Response path of the next cursor.                                      | `null`                                                                               |
| [`infinite.previousParam`](#infinitepreviousparam)                        | Response path of the previous cursor.                                  | `null`                                                                               |
| [`infinite.getNextPageParam`](#infinitegetnextpageparam)                  | Source of TanStack Query's `getNextPageParam`.                         | `null`                                                                               |
| [`infinite.getPreviousPageParam`](#infinitegetpreviouspageparam)          | Source of TanStack Query's `getPreviousPageParam`.                     | `null`                                                                               |
| [`infinite.cursorParam`](#infinitecursorparam)                            | Deprecated. Top-level response field of the cursor.                    | `null`                                                                               |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`. | `{ path: 'hooks', barrel: { type: 'named' } }`                                       |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                           | None                                                                                 |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                       | None                                                                                 |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                            | `[]`                                                                                 |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                   | `[]`                                                                                 |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                              | `resolverVueQuery`                                                                   |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                     | `[]`                                                                                 |

## Option details

### client

Selects the registered client plugin whose functions the composables call. A single registered client plugin is detected, so set `client` only when several are registered. Generation fails when none is registered.

|          |                                  |
| -------- | -------------------------------- |
| Type     | `'fetch' \| 'axios' \| 'client'` |
| Required | `false`                          |

::field-group

:::field{name="'fetch'"}
Calls the functions of [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch).
:::

:::field{name="'axios'"}
Calls the functions of [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios).
:::

:::field{name="'client'"}
Calls the functions of [`@kubb/plugin-client`](https://kubb.dev/extensions/kubb-labs/plugin-client). Your client module must also export the `RequestConfig` and `ResponseErrorConfig` types.
:::

::

### returnType

Shape of the value the composables resolve to.

|          |                    |
| -------- | ------------------ |
| Type     | `'data' \| 'full'` |
| Required | `false`            |
| Default  | `'data'`           |

::field-group

:::field{name="'data'"}
Default. Resolves to the success body.
:::

:::field{name="'full'"}
Resolves to the client's whole `RequestResult`, such as `{ status, data, error, headers, response }`, so a composable can read the status and response headers. Infinite queries read the cursor from `lastPage.data`. Needs a client plugin with `returnType` `'full'` or `'plain'`, or generation stops with an error.
:::

::

```typescript
pluginVueQuery({ returnType: 'full' })

const { data: result } = useGetPetById({ path: { petId: 1 } })
const etag = result.value?.response.headers.get('ETag')
```

The example sets [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter. With the default, an `int64` id such as `petId` is a `bigint` and takes `1n`.

### hooks

With `false`, the plugin writes only the `queryOptions`, `queryKey`, and `mutationKey` helpers. Set `true` to also generate `useQuery` and `useMutation`. [`infinite`](#infinite) needs it. [Call operations](https://kubb.dev/extensions/kubb-labs/plugin-vue-query/guides/calling-operations#what-each-plugin-generates) lists every generated helper.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

### query

Which operations become queries and where TanStack Query is imported from. Pass `false` to skip query output for every operation.

|          |                                                                    |
| -------- | ------------------------------------------------------------------ |
| Type     | `Partial<Query> \| false`                                          |
| Required | `false`                                                            |
| Default  | `{ methods: ['GET', 'QUERY'], importPath: '@tanstack/vue-query' }` |

#### query.methods

HTTP methods treated as queries. An operation whose method is in neither `query.methods` nor `mutation.methods` gets no helper, so keep `'QUERY'` when you replace the list.

|          |                    |
| -------- | ------------------ |
| Type     | `Array<string>`    |
| Required | `false`            |
| Default  | `['GET', 'QUERY']` |

#### query.importPath

Module the query helpers import `queryOptions`, `useQuery`, and their infinite variants from, such as a wrapper that sets a default `QueryClient`.

|          |                         |
| -------- | ----------------------- |
| Type     | `string`                |
| Required | `false`                 |
| Default  | `'@tanstack/vue-query'` |

### queryKey

Builds the `queryKey` of each query from the operation `node` and the `variant`: `'query'` or `'infiniteQuery'`. The returned strings are copied into the generated code as written, so wrap a string literal in `JSON.stringify(...)`.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `queryKeyTransformer`                                  |

The default key is `[{ url, params }, query, body]`, with `url` such as `'/pet/:petId'` and only the parts the operation has. Infinite variants add `infinite: true` to the first entry, so they never share a cache entry with the plain query. To extend the default, spread it instead of reading single entries, which can change between releases:

```typescript
import { queryKeyTransformer } from '@kubb/plugin-vue-query'

queryKey: (props) => [JSON.stringify('v2'), ...queryKeyTransformer(props)]
```

### mutation

Which operations become mutations and where TanStack Query is imported from. Pass `false` to skip mutation output for every operation.

|          |                                                                                      |
| -------- | ------------------------------------------------------------------------------------ |
| Type     | `Partial<Mutation> \| false`                                                         |
| Required | `false`                                                                              |
| Default  | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/vue-query' }` |

#### mutation.methods

HTTP methods treated as mutations. A method that is also in `query.methods` stays a query.

|          |                                      |
| -------- | ------------------------------------ |
| Type     | `Array<string>`                      |
| Required | `false`                              |
| Default  | `['POST', 'PUT', 'PATCH', 'DELETE']` |

#### mutation.importPath

Module the mutation composables import `useMutation` from. Only used with [`hooks: true`](#hooks).

|          |                         |
| -------- | ----------------------- |
| Type     | `string`                |
| Required | `false`                 |
| Default  | `'@tanstack/vue-query'` |

### mutationKey

Builds the `mutationKey` of each mutation, for batched invalidations. It takes the same props as [`queryKey`](#querykey) with `variant: 'mutation'`, and copies strings the same way. The default key is `[{ url }]`.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `mutationKeyTransformer`                               |

```typescript
import { mutationKeyTransformer } from '@kubb/plugin-vue-query'

mutationKey: (props) => [JSON.stringify('v2'), ...mutationKeyTransformer(props)]
```

### infinite

Adds `infiniteQueryOptions` and `useInfiniteQuery` for each query operation that declares the query parameter named in [`infinite.queryParam`](#infinitequeryparam). Needs [`hooks: true`](#hooks).

|          |                              |
| -------- | ---------------------------- |
| Type     | `Partial<Infinite> \| false` |
| Required | `false`                      |
| Default  | `false`                      |

Without `getNextPageParam`, `nextParam`, or `cursorParam`, the composable counts pages up from `initialPageParam` until a page is an empty array. That works only for array responses, so generation warns for any other response.

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

Path to the previous cursor on the response, in dot notation or array form.

|          |                                   |
| -------- | --------------------------------- |
| Type     | `string \| Array<string> \| null` |
| Required | `false`                           |
| Default  | `null`                            |

#### infinite.getNextPageParam

Source of TanStack Query's `getNextPageParam`, copied into the generated code. Use it when the next page must be computed. It wins over `nextParam` and `cursorParam`.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `string \| PageParamFn \| null` |
| Required | `false`                         |
| Default  | `null`                          |

Pass a string, a function, or `definePageParam`, which types the page and the page parameter. Only the source is copied, so the function cannot use variables from the config file.

```typescript [kubb.config.ts]
import { definePageParam, pluginVueQuery } from '@kubb/plugin-vue-query'

type PetsPage = { hasNext: boolean; number: number }

pluginVueQuery({
  hooks: true,
  infinite: {
    queryParam: 'page',
    getNextPageParam: definePageParam<PetsPage, number>((lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined)),
  },
})
```

#### infinite.getPreviousPageParam

Source of TanStack Query's `getPreviousPageParam`, in the same forms as `getNextPageParam`. It wins over `previousParam` and `cursorParam`.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `string \| PageParamFn \| null` |
| Required | `false`                         |
| Default  | `null`                          |

#### infinite.cursorParam

Deprecated. Name of a top-level response field that holds the cursor for both directions. Dot paths do not work. Use `nextParam` and `previousParam` instead.

|          |                  |
| -------- | ---------------- |
| Type     | `string \| null` |
| Required | `false`          |
| Default  | `null`           |

### resolver

Overrides generated file and symbol names. Members you leave out keep `resolverVueQuery`. The shared members (`name`, `file`, `imports`) are described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver).

|          |                                   |
| -------- | --------------------------------- |
| Type     | `ResolverPatch<ResolverVueQuery>` |
| Required | `false`                           |

::code-collapse{name="ResolverVueQuery patch members"}

```typescript [Partial override]
type ResolverVueQueryPatch = {
  // plus the shared name, file, and imports members
  query?: {
    name?(node: OperationNode): string // 'useGetPetById'
    optionsName?(node: OperationNode): string // 'getPetByIdQueryOptions'
    keyName?(node: OperationNode): string // 'getPetByIdQueryKey'
    keyTypeName?(node: OperationNode): string // 'GetPetByIdQueryKey'
  }
  // same members, with an Infinite suffix
  infiniteQuery?: ResolverVueQueryPatch['query']
  mutation?: {
    name?(node: OperationNode): string // 'useUpdatePet'
    keyName?(node: OperationNode): string // 'updatePetMutationKey'
  }
}
```

::
