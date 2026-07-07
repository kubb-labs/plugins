import { createResolver } from 'kubb/kit'
import type { PluginVueQuery } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

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
  query: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`
    },
    keyName(node) {
      return `${this.name(node.operationId)}QueryKey`
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}QueryKey`
    },
    optionsName(node) {
      return `${this.name(node.operationId)}QueryOptions`
    },
    clientName(node) {
      return this.name(node.operationId)
    },
  },
  infiniteQuery: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}Infinite`
    },
    keyName(node) {
      return `${this.name(node.operationId)}InfiniteQueryKey`
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}InfiniteQueryKey`
    },
    optionsName(node) {
      return `${this.name(node.operationId)}InfiniteQueryOptions`
    },
    clientName(node) {
      return `${this.name(node.operationId)}Infinite`
    },
  },
  mutation: {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`
    },
    keyName(node) {
      return `${this.name(node.operationId)}MutationKey`
    },
    typeName(node) {
      return capitalize(this.name(node.operationId))
    },
  },
})
