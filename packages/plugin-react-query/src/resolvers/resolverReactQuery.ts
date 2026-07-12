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
 * Functions and files use the built-in camelCase casing; hooks get the `use`
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
  query: createQueryResolver(),
  suspenseQuery: createQueryResolver('Suspense'),
  infiniteQuery: createQueryResolver('Infinite'),
  suspenseInfiniteQuery: createQueryResolver('SuspenseInfinite'),
  mutation: {
    ...createMutationResolver(),
    optionsName(node) {
      return `${this.name(node.operationId)}MutationOptions`
    },
    typeName(node) {
      return capitalize(this.name(node.operationId))
    },
  },
  hook: {
    optionsName() {
      return 'HookOptions'
    },
    customOptionsName() {
      return 'getCustomHookOptions'
    },
  },
})
