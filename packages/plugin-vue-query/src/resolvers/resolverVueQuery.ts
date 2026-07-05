import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginVueQuery } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

/**
 * Default resolver used by `@kubb/plugin-vue-query`. Decides the names and
 * file paths for every generated TanStack Query composable (`useFoo`,
 * `useFooInfinite`) and its companion helpers.
 *
 * Functions and files use camelCase; composables get the `use` prefix.
 *
 * @example Resolve composable and helper names
 * ```ts
 * import { resolverVueQuery } from '@kubb/plugin-vue-query'
 *
 * resolverVueQuery.resolveQueryName(operationNode)       // 'useGetPetById'
 * resolverVueQuery.resolveQueryKeyName(operationNode)    // 'getPetByIdQueryKey'
 * resolverVueQuery.resolveQueryOptionsName(operationNode) // 'getPetByIdQueryOptions'
 * ```
 */
export const resolverVueQuery = defineResolver<PluginVueQuery>(() => ({
  name: 'default',
  pluginName: 'plugin-vue-query',
  core: {
    name(name) {
      return camelCase(name)
    },
    fileName(name) {
      return toFilePath(name)
    },
  },
  resolveName(name) {
    return this.core.name(name)
  },
  resolveQueryName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}`
  },
  resolveInfiniteQueryName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}Infinite`
  },
  resolveMutationName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}`
  },
  resolveQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}QueryOptions`
  },
  resolveInfiniteQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}InfiniteQueryOptions`
  },
  resolveQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}QueryKey`
  },
  resolveInfiniteQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}InfiniteQueryKey`
  },
  resolveMutationKeyName(node) {
    return `${this.resolveName(node.operationId)}MutationKey`
  },
  resolveQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}QueryKey`
  },
  resolveInfiniteQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}InfiniteQueryKey`
  },
  resolveMutationTypeName(node) {
    return capitalize(this.resolveName(node.operationId))
  },
  resolveClientName(node) {
    return this.resolveName(node.operationId)
  },
  resolveInfiniteClientName(node) {
    return `${this.resolveName(node.operationId)}Infinite`
  },
}))
