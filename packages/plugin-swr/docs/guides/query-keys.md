# SWR keys

See the key each generated `useSWR` and `useSWRMutation` hook passes, revalidate with SWR's `mutate`, and add your own prefix to the default key.

## The default key

When you call SWR's `mutate` or read the cache, take the key from the `<operation>QueryKey` helper in each hook file. It builds `[{ url, params }, query, body]`, and the hook passes it to `useSWR`:

::code-group

```typescript [Generated]
// src/gen/hooks/useGetPetById.ts
export const getPetByIdQueryKey = ({ path }: Omit<GetPetByIdOptions, 'headers'>) => [{ url: '/pet/:petId', params: path }] as const

// inside useGetPetById(), shortened
const queryKey = getPetByIdQueryKey({ path })
return useSWR(shouldFetch ? queryKey : null, { ...getPetByIdQueryOptions({ path }, config), ...queryOptions })
```

```typescript [Usage]
import { mutate } from 'swr'
import { getPetByIdQueryKey } from './gen/hooks/useGetPetById'

getPetByIdQueryKey({ path: { petId: 1 } }) // [{ url: '/pet/:petId', params: { petId: 1 } }]

await mutate(getPetByIdQueryKey({ path: { petId: 1 } }))
```

::

- `url` is the spec path with `:name` placeholders, such as `'/pet/:petId'`.
- `params` holds the path parameters, when the path has any.
- `query` and `body` follow when the operation has them and the call passes them.
- Headers and cookies stay out of the key.
- `shouldFetch: false` passes `null` instead of the key, so SWR skips the request.

## Mutation keys

Each mutation gets a `<operation>MutationKey` helper that returns `[{ url }]`. The hook passes it to `useSWRMutation`, or `null` with `shouldFetch: false`:

```typescript [src/gen/hooks/useUpdatePet.ts]
export const updatePetMutationKey = () => [{ url: '/pet' }] as const
```

## Extend the default key

When you need your own entry, such as an API version, set [`queryKey`](https://kubb.dev/extensions/kubb-labs/plugin-swr/options#querykey) and spread `queryKeyTransformer`. Do not read single entries of its result: they can change between releases.

> [!WARNING]
> Returned strings are copied into the generated code as written. Wrap a string literal in `JSON.stringify(...)`.

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginSwr, queryKeyTransformer } from '@kubb/plugin-swr'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginFetch(),
    pluginSwr({
      queryKey: (props) => [JSON.stringify(props.node.operationId), ...queryKeyTransformer(props)],
    }),
  ],
})
```

```typescript [Generated]
export const findPetsByTagsQueryKey = ({ query }: Omit<FindPetsByTagsOptions, 'headers'> = {}) =>
  ["findPetsByTags", { url: '/pet/findByTags' }, ...(query ? [query] : [])] as const
```

::

[`mutationKey`](https://kubb.dev/extensions/kubb-labs/plugin-swr/options#mutationkey) works the same way with `mutationKeyTransformer`.

## Revalidate every call of an operation

SWR's `mutate` matches the whole key, not a prefix. To revalidate every cached call of an operation, give the keys your own first entry, as above, and pass a filter function:

```typescript
import { mutate } from 'swr'

await mutate((key) => Array.isArray(key) && key[0] === 'findPetsByTags')
```

Next, [skip requests until ready](https://kubb.dev/extensions/kubb-labs/plugin-swr/guides/calling-operations#skip-requests-until-ready) with `shouldFetch`.
