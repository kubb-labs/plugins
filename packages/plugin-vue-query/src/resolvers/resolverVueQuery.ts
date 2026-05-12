import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginVueQuery } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

/**
 * Naming convention resolver for Vue Query plugin.
 *
 * Provides default naming helpers using camelCase for functions and file paths.
 */
export const resolverVueQuery = defineResolver<PluginVueQuery>(() => ({
  name: 'default',
  pluginName: 'plugin-vue-query',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
  resolvePathName(name, type) {
    return this.default(name, type)
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
