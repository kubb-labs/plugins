import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginReactQuery } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

/**
 * Naming convention resolver for React Query plugin.
 *
 * Provides default naming helpers using camelCase for functions and file paths.
 *
 * @example
 * `resolverReactQuery.default('list pets', 'function')  // → 'listPets'`
 */
export const resolverReactQuery = defineResolver<PluginReactQuery>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-react-query',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return ctx.default(name, 'function')
  },
  resolvePathName(name, type) {
    return ctx.default(name, type)
  },
  resolveQueryName(node) {
    return `use${capitalize(ctx.resolveName(node.operationId))}`
  },
  resolveSuspenseQueryName(node) {
    return `use${capitalize(ctx.resolveName(node.operationId))}Suspense`
  },
  resolveInfiniteQueryName(node) {
    return `use${capitalize(ctx.resolveName(node.operationId))}Infinite`
  },
  resolveSuspenseInfiniteQueryName(node) {
    return `use${capitalize(ctx.resolveName(node.operationId))}SuspenseInfinite`
  },
  resolveMutationName(node) {
    return `use${capitalize(ctx.resolveName(node.operationId))}`
  },
  resolveQueryOptionsName(node) {
    return `${ctx.resolveName(node.operationId)}QueryOptions`
  },
  resolveSuspenseQueryOptionsName(node) {
    return `${ctx.resolveName(node.operationId)}SuspenseQueryOptions`
  },
  resolveInfiniteQueryOptionsName(node) {
    return `${ctx.resolveName(node.operationId)}InfiniteQueryOptions`
  },
  resolveSuspenseInfiniteQueryOptionsName(node) {
    return `${ctx.resolveName(node.operationId)}SuspenseInfiniteQueryOptions`
  },
  resolveMutationOptionsName(node) {
    return `${ctx.resolveName(node.operationId)}MutationOptions`
  },
  resolveQueryKeyName(node) {
    return `${ctx.resolveName(node.operationId)}QueryKey`
  },
  resolveSuspenseQueryKeyName(node) {
    return `${ctx.resolveName(node.operationId)}SuspenseQueryKey`
  },
  resolveInfiniteQueryKeyName(node) {
    return `${ctx.resolveName(node.operationId)}InfiniteQueryKey`
  },
  resolveSuspenseInfiniteQueryKeyName(node) {
    return `${ctx.resolveName(node.operationId)}SuspenseInfiniteQueryKey`
  },
  resolveMutationKeyName(node) {
    return `${ctx.resolveName(node.operationId)}MutationKey`
  },
  resolveQueryKeyTypeName(node) {
    return `${capitalize(ctx.resolveName(node.operationId))}QueryKey`
  },
  resolveSuspenseQueryKeyTypeName(node) {
    return `${capitalize(ctx.resolveName(node.operationId))}SuspenseQueryKey`
  },
  resolveInfiniteQueryKeyTypeName(node) {
    return `${capitalize(ctx.resolveName(node.operationId))}InfiniteQueryKey`
  },
  resolveSuspenseInfiniteQueryKeyTypeName(node) {
    return `${capitalize(ctx.resolveName(node.operationId))}SuspenseInfiniteQueryKey`
  },
  resolveMutationTypeName(node) {
    return capitalize(ctx.resolveName(node.operationId))
  },
  resolveClientName(node) {
    return ctx.resolveName(node.operationId)
  },
  resolveSuspenseClientName(node) {
    return `${ctx.resolveName(node.operationId)}Suspense`
  },
  resolveInfiniteClientName(node) {
    return `${ctx.resolveName(node.operationId)}Infinite`
  },
  resolveSuspenseInfiniteClientName(node) {
    return `${ctx.resolveName(node.operationId)}SuspenseInfinite`
  },
  resolveHookOptionsName() {
    return 'HookOptions'
  },
  resolveCustomHookOptionsName() {
    return 'getCustomHookOptions'
  },
}))
