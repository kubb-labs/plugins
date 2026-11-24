# Options

Pass these options to `pluginSwr()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                      | Default                                                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`client`](#client)                                                       | Which registered client plugin the hooks call.               | Auto-detected                                                                 |
| [`returnType`](#returntype)                                               | What the hooks resolve to.                                   | `'data'`                                                                      |
| [`query`](#query)                                                         | Which methods become `useSWR` hooks, and the import.         | `{ methods: ['GET', 'QUERY'], importPath: 'swr' }`                            |
| [`query.methods`](#querymethods)                                          | Methods that become `useSWR` hooks.                          | `['GET', 'QUERY']`                                                            |
| [`query.importPath`](#queryimportpath)                                    | Import path of `useSWR`.                                     | `'swr'`                                                                       |
| [`queryKey`](#querykey)                                                   | Build the SWR key of each query.                             | `queryKeyTransformer`                                                         |
| [`mutation`](#mutation)                                                   | Which methods become `useSWRMutation` hooks, and the import. | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: 'swr/mutation' }` |
| [`mutation.methods`](#mutationmethods)                                    | Methods that become `useSWRMutation` hooks.                  | `['POST', 'PUT', 'PATCH', 'DELETE']`                                          |
| [`mutation.importPath`](#mutationimportpath)                              | Import path of `useSWRMutation`.                             | `'swr/mutation'`                                                              |
| [`mutationKey`](#mutationkey)                                             | Build the SWR key of each mutation.                          | `mutationKeyTransformer`                                                      |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                     | `{ path: 'hooks', barrel: { type: 'named' } }`                                |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                 | None                                                                          |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                             | None                                                                          |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                  | `[]`                                                                          |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                         | `[]`                                                                          |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                    | `resolverSwr`                                                                 |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                           | `[]`                                                                          |

> [!NOTE]
> The plugin always generates hooks, so it has no `hooks` option. It does not generate `useSWRInfinite` or suspense hooks.

## Option details

### client

The registered client plugin whose functions the hooks call. A lone client plugin is detected, so set `client` only when several are registered. Generation fails when none is registered.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'fetch' \| 'axios' \| 'ky' \| 'client'` |
| Required | `false`                                  |

::field-group

:::field{name="'fetch'"}
Calls [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch) functions.
:::

:::field{name="'axios'"}
Calls [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios) functions.
:::

:::field{name="'ky'"}
Calls [`@kubb/plugin-ky`](https://kubb.dev/extensions/kubb-labs/plugin-ky) functions.
:::

:::field{name="'client'"}
Calls [`@kubb/plugin-client`](https://kubb.dev/extensions/kubb-labs/plugin-client) functions. Your client module must also export the `RequestConfig` and `ResponseErrorConfig` types.
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
Default. Resolves to the success body.
:::

:::field{name="'full'"}
Resolves to the client's whole `RequestResult`, so a hook can read the status and response headers. Needs a client plugin with `returnType` `'full'` or `'plain'`, or generation stops with an error.
:::

::

```typescript
pluginSwr({ returnType: 'full' })

// with integerType: 'number' on the adapter
const { data: result } = useGetPetById({ path: { petId: 1 } })
const etag = result?.response.headers.get('ETag')
```

### query

Which operations become `useSWR` hooks and where `useSWR` is imported from. `false` skips query output.

|          |                                                    |
| -------- | -------------------------------------------------- |
| Type     | `Partial<Query> \| false`                          |
| Required | `false`                                            |
| Default  | `{ methods: ['GET', 'QUERY'], importPath: 'swr' }` |

#### query.methods

HTTP methods treated as queries. A method in neither `query.methods` nor `mutation.methods` gets no hook, so keep `'QUERY'` when you replace the list.

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

Builds each query's SWR key from the operation `node` and `variant: 'query'`. The default key is `[{ url, params }, query, body]`, with only the parts the operation has.

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Type     | `(props: { node, casing, variant }) => Array<unknown>` |
| Required | `false`                                                |
| Default  | `queryKeyTransformer`                                  |

> [!WARNING]
> Returned strings are copied into the generated code as written. Wrap a string literal in `JSON.stringify(...)`.

To extend the default, spread it. Single entries can change between releases. See [SWR keys](https://kubb.dev/extensions/kubb-labs/plugin-swr/guides/query-keys).

```typescript
import { queryKeyTransformer } from '@kubb/plugin-swr'

queryKey: (props) => [JSON.stringify('v2'), ...queryKeyTransformer(props)]
```

### mutation

Which operations become `useSWRMutation` hooks and where `useSWRMutation` is imported from. `false` skips mutation output.

|          |                                                                               |
| -------- | ----------------------------------------------------------------------------- |
| Type     | `Partial<Mutation> \| false`                                                  |
| Required | `false`                                                                       |
| Default  | `{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: 'swr/mutation' }` |

#### mutation.methods

HTTP methods treated as mutations. A method also in `query.methods` stays a query.

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

Builds each mutation's SWR key, for matching keys in SWR's global `mutate`. It takes the same props as [`queryKey`](#querykey) with `variant: 'mutation'`, and copies strings the same way. The default key is `[{ url }]`.

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

Overrides generated file and symbol names. Members you leave out keep `resolverSwr`. See [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) for the shared `name`, `file`, and `imports` members. Pass an array to merge several patches over `resolverSwr`, left to right.

|          |                              |
| -------- | ---------------------------- |
| Type     | `ResolverInput<ResolverSwr>` |
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
