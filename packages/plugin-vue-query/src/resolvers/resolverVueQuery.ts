import { createMutationResolver, createQueryResolver } from '@internals/tanstack-query'
import { capitalize } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginVueQuery } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-vue-query`. Decides the names and
 * file paths for every generated TanStack Query composable (`useFoo`,
 * `useFooInfinite`) and its companion helpers.
 *
 * The `default` helpers are supplied by `createResolver`. Functions and files use camelCase;
 * composables get the `use` prefix. Operation-specific naming is grouped under the `query`,
 * `infiniteQuery`, and `mutation` namespaces.
 *
 * @example Resolve composable and helper names
 * ```ts
 * import { resolverVueQuery } from '@kubb/plugin-vue-query'
 *
 * resolverVueQuery.query.name(operationNode)        // 'useGetPetById'
 * resolverVueQuery.query.keyName(operationNode)     // 'getPetByIdQueryKey'
 * resolverVueQuery.query.optionsName(operationNode) // 'getPetByIdQueryOptions'
 * ```
 */
export const resolverVueQuery = createResolver<PluginVueQuery>({
  pluginName: 'plugin-vue-query',
  query: createQueryResolver(),
  infiniteQuery: createQueryResolver('Infinite'),
  mutation: {
    ...createMutationResolver(),
    typeName(node) {
      return capitalize(this.name(node.operationId))
    },
  },
})
