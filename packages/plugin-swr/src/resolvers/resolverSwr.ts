import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
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
 * `resolverSwr.core.name('list pets')  // → 'listPets'`
 */
export const resolverSwr = defineResolver<PluginSwr>(() => ({
  name: 'default',
  pluginName: 'plugin-swr',
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
