# Options

Pass these options to `pluginSwr()`, all of them optional. Rows for shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options) and give this plugin's default.

## Options overview

| Option                                                                    | Purpose                                                                  | Default                                                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`client`](#client)                                                       | Which registered client plugin the hooks call.                           | Auto-detected                                                                 |
| [`returnType`](#returntype)                                               | Shape of the value the hooks resolve to.                                 | `'data'`                                                                      |
| [`query`](#query)                                                         | Which operations become `useSWR` hooks, or `false` to skip them.         | `{ methods: ['GET', 'QUERY'], importPath: 'swr' }`                            |
| [`query.methods`](#querymethods)                                          | HTTP methods treated as queries.                                         | `['GET', 'QUERY']`                                                            |
| [`query.importPath`](#queryimportpath)                                    | Module `useSWR` is imported from.                                        | `'swr'`                                                                       |
| [`queryKey`](#querykey)                                                   | Build the SWR key of each query.                                         | `queryKeyTransformer`                                                         |
| [`mutation`](#mutation)                                                   | Which operations become `useSWRMutation` hooks, or `false` to skip them. | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: 'swr/mutation' }` |
| [`mutation.methods`](#mutationmethods)                                    | HTTP methods treated as mutations.                                       | `['POST', 'PUT', 'PATCH', 'DELETE']`                                          |
| [`mutation.importPath`](#mutationimportpath)                              | Module `useSWRMutation` is imported from.                                | `'swr/mutation'`                                                              |
| [`mutationKey`](#mutationkey)                                             | Build the SWR key of each mutation.                                      | `mutationKeyTransformer`                                                      |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.   | `{ path: 'hooks', barrel: { type: 'named' } }`                                |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                             | None                                                                          |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                         | None                                                                          |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                              | `[]`                                                                          |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                     | `[]`                                                                          |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                                | `resolverSwr`                                                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                       | `[]`                                                                          |

The plugin always generates hooks, so it has no `hooks` option, and it does not generate `useSWRInfinite` or suspense hooks.

## Option details

### client

Selects the registered client plugin whose functions the hooks call. A single registered client plugin is detected, so set `client` only when several are registered. Generation fails when none is registered.

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

Shape of the value the hooks resolve to.

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
Resolves to the client's whole `RequestResult`, such as `{ status, data, error, headers, response }`, so a hook can read the status and response headers. Needs a client plugin with `returnType` `'full'` or `'plain'`, or generation stops with an error.
:::

::

```typescript
pluginSwr({ returnType: 'full' })

const { data: result } = useGetPetById({ path: { petId: 1 } })
const etag = result?.response.headers.get('ETag')
```

The example sets [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter. With the default, an `int64` id such as `petId` is a `bigint` and takes `1n`.

### query

Which operations become `useSWR` hooks and where `useSWR` is imported from. Pass `false` to skip query output for every operation.

|          |                                                    |
| -------- | -------------------------------------------------- |
| Type     | `Partial<Query> \| false`                          |
| Required | `false`                                            |
| Default  | `{ methods: ['GET', 'QUERY'], importPath: 'swr' }` |

#### query.methods

HTTP methods treated as queries. An operation whose method is in neither `query.methods` nor `mutation.methods` gets no hook, so keep `'QUERY'` when you replace the list.

|          |                    |
| -------- | ------------------ |
| Type     | `Array<string>`    |
| Required | `false`            |
| Default  | `['GET', 'QUERY']` |

#### query.importPath

Module of the default `useSWR` import, written as `import useSWR from '<importPath>'`. A relative path resolves from the generated file.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'swr'`  |

### queryKey

Builds the SWR key of each query from the operation `node` and `variant: 'query'`. The returned strings are copied into the generated code as written, so wrap a string literal in `JSON.stringify(...)`.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `queryKeyTransformer`                                  |

The default key is `[{ url, params }, query, body]`, with `url` such as `'/pet/:petId'` and only the parts the operation has. To extend the default, spread it instead of reading single entries, which can change between releases:

```typescript
import { queryKeyTransformer } from '@kubb/plugin-swr'

queryKey: (props) => [JSON.stringify('v2'), ...queryKeyTransformer(props)]
```

### mutation

Which operations become `useSWRMutation` hooks and where `useSWRMutation` is imported from. Pass `false` to skip mutation output for every operation.

|          |                                                                               |
| -------- | ----------------------------------------------------------------------------- |
| Type     | `Partial<Mutation> \| false`                                                  |
| Required | `false`                                                                       |
| Default  | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: 'swr/mutation' }` |

#### mutation.methods

HTTP methods treated as mutations. A method that is also in `query.methods` stays a query.

|          |                                      |
| -------- | ------------------------------------ |
| Type     | `Array<string>`                      |
| Required | `false`                              |
| Default  | `['POST', 'PUT', 'PATCH', 'DELETE']` |

#### mutation.importPath

Module of the default `useSWRMutation` import, written as `import useSWRMutation from '<importPath>'`. A relative path resolves from the generated file.

|          |                  |
| -------- | ---------------- |
| Type     | `string`         |
| Required | `false`          |
| Default  | `'swr/mutation'` |

### mutationKey

Builds the SWR key of each mutation, for matching keys in SWR's global `mutate`. It takes the same props as [`queryKey`](#querykey) with `variant: 'mutation'`, and copies strings the same way. The default key is `[{ url }]`.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `mutationKeyTransformer`                               |

```typescript
import { mutationKeyTransformer } from '@kubb/plugin-swr'

mutationKey: (props) => [JSON.stringify('v2'), ...mutationKeyTransformer(props)]
```

### resolver

Overrides generated file and symbol names. Members you leave out keep `resolverSwr`. The shared members (`name`, `file`, `imports`) are described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver).

|          |                              |
| -------- | ---------------------------- |
| Type     | `ResolverPatch<ResolverSwr>` |
| Required | `false`                      |

::code-collapse{name="ResolverSwr patch members"}

```typescript [Partial override]
type ResolverSwrPatch = {
  // plus the shared name, file, and imports members
  query?: {
    name?(node: OperationNode): string // 'useGetPetById'
    optionsName?(node: OperationNode): string // 'getPetByIdQueryOptions'
    keyName?(node: OperationNode): string // 'getPetByIdQueryKey'
    keyTypeName?(node: OperationNode): string // 'GetPetByIdQueryKey'
  }
  mutation?: {
    name?(node: OperationNode): string // 'useUpdatePet'
    keyName?(node: OperationNode): string // 'updatePetMutationKey'
    keyTypeName?(node: OperationNode): string // 'UpdatePetMutationKey'
    argTypeName?(node: OperationNode): string // 'UpdatePetMutationArg'
  }
}
```

::
