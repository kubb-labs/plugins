import { resolveOperationName } from '@internals/shared'
import { createMutationResolver, createQueryResolver } from '@internals/tanstack-query'
import { capitalize } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginReactQuery } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-react-query`. Decides the names and
 * file paths for every generated TanStack Query hook (`useFoo`,
 * `useFooSuspense`, `useFooInfinite`, ...) and its companion helpers
 * (`fooQueryKey`, `fooQueryOptions`).
 *
 * Functions use safe camelCase identifiers; hooks get the `use`
 * prefix; suspense and infinite variants are suffixed with `Suspense`/`Infinite`.
 *
 * @example Resolve hook and helper names
 * ```ts
 * import { resolverReactQuery } from '@kubb/plugin-react-query'
 *
 * resolverReactQuery.query.name(operationNode)       // 'useGetPetById'
 * resolverReactQuery.mutation.name(operationNode)    // 'useUpdatePet'
 * resolverReactQuery.query.keyName(operationNode)     // 'getPetByIdQueryKey'
 * resolverReactQuery.query.optionsName(operationNode) // 'getPetByIdQueryOptions'
 * ```
 */
export const resolverReactQuery = createResolver<PluginReactQuery>({
  pluginName: 'plugin-react-query',
  name: resolveOperationName,
  query: createQueryResolver(),
  suspenseQuery: createQueryResolver('Suspense'),
  infiniteQuery: createQueryResolver('Infinite'),
  suspenseInfiniteQuery: createQueryResolver('SuspenseInfinite'),
  mutation: {
    ...createMutationResolver(),
    optionsName(node) {
      const name = `${this.name(node.operationId)}MutationOptions`
      return this.resolveName({ key: ['operation', node.method, node.path, name], name })
    },
    typeName(node) {
      const name = capitalize(this.name(node.operationId))
      return this.resolveName({ key: ['operation', node.method, node.path, name], name })
    },
  },
  hook: {
    optionsName() {
      return this.resolveName({ key: ['hook', 'options'], name: 'HookOptions' })
    },
    customOptionsName() {
      return this.resolveName({ key: ['hook', 'custom-options'], name: 'getCustomHookOptions' })
    },
  },
})
