import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginSwr } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

/**
 * Naming convention resolver for the SWR plugin.
 *
 * Provides default naming helpers using camelCase for functions and file paths.
 *
 * @example
 * `resolverSwr.default('list pets', 'function')  // → 'listPets'`
 */
export const resolverSwr = defineResolver<PluginSwr>(() => ({
  name: 'default',
  pluginName: 'plugin-swr',
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
  resolveMutationName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}`
  },
  resolveQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}QueryOptions`
  },
  resolveQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}QueryKey`
  },
  resolveMutationKeyName(node) {
    return `${this.resolveName(node.operationId)}MutationKey`
  },
  resolveQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}QueryKey`
  },
  resolveMutationKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}MutationKey`
  },
  resolveMutationArgTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}MutationArg`
  },
  resolveClientName(node) {
    return this.resolveName(node.operationId)
  },
}))
