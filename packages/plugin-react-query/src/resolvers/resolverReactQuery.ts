import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginReactQuery } from '../types.ts'

function capitalize(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

/**
 * Default resolver used by `@kubb/plugin-react-query`. Decides the names and
 * file paths for every generated TanStack Query hook (`useFooQuery`,
 * `useFooMutation`, `useFooInfiniteQuery`, ...) and its companion helpers
 * (`fooQueryKey`, `fooQueryOptions`).
 *
 * Functions and files use camelCase; hooks get the `use` prefix; suspense and
 * infinite variants are suffixed with `Suspense`/`Infinite`.
 *
 * @example Resolve hook and helper names
 * ```ts
 * import { resolverReactQuery } from '@kubb/plugin-react-query'
 *
 * resolverReactQuery.resolveQueryName(operationNode)       // 'useGetPetById'
 * resolverReactQuery.resolveMutationName(operationNode)    // 'useUpdatePet'
 * resolverReactQuery.resolveQueryKeyName(operationNode)    // 'getPetByIdQueryKey'
 * resolverReactQuery.resolveQueryOptionsName(operationNode) // 'getPetByIdQueryOptions'
 * ```
 */
export const resolverReactQuery = defineResolver<PluginReactQuery>(() => ({
  name: 'default',
  pluginName: 'plugin-react-query',
  default(name, type) {
    return type === 'file' ? toFilePath(name) : camelCase(name)
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
  resolveSuspenseQueryName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}Suspense`
  },
  resolveInfiniteQueryName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}Infinite`
  },
  resolveSuspenseInfiniteQueryName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}SuspenseInfinite`
  },
  resolveMutationName(node) {
    return `use${capitalize(this.resolveName(node.operationId))}`
  },
  resolveQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}QueryOptions`
  },
  resolveSuspenseQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}SuspenseQueryOptions`
  },
  resolveInfiniteQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}InfiniteQueryOptions`
  },
  resolveSuspenseInfiniteQueryOptionsName(node) {
    return `${this.resolveName(node.operationId)}SuspenseInfiniteQueryOptions`
  },
  resolveMutationOptionsName(node) {
    return `${this.resolveName(node.operationId)}MutationOptions`
  },
  resolveQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}QueryKey`
  },
  resolveSuspenseQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}SuspenseQueryKey`
  },
  resolveInfiniteQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}InfiniteQueryKey`
  },
  resolveSuspenseInfiniteQueryKeyName(node) {
    return `${this.resolveName(node.operationId)}SuspenseInfiniteQueryKey`
  },
  resolveMutationKeyName(node) {
    return `${this.resolveName(node.operationId)}MutationKey`
  },
  resolveQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}QueryKey`
  },
  resolveSuspenseQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}SuspenseQueryKey`
  },
  resolveInfiniteQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}InfiniteQueryKey`
  },
  resolveSuspenseInfiniteQueryKeyTypeName(node) {
    return `${capitalize(this.resolveName(node.operationId))}SuspenseInfiniteQueryKey`
  },
  resolveMutationTypeName(node) {
    return capitalize(this.resolveName(node.operationId))
  },
  resolveClientName(node) {
    return this.resolveName(node.operationId)
  },
  resolveSuspenseClientName(node) {
    return `${this.resolveName(node.operationId)}Suspense`
  },
  resolveInfiniteClientName(node) {
    return `${this.resolveName(node.operationId)}Infinite`
  },
  resolveSuspenseInfiniteClientName(node) {
    return `${this.resolveName(node.operationId)}SuspenseInfinite`
  },
  resolveHookOptionsName() {
    return 'HookOptions'
  },
  resolveCustomHookOptionsName() {
    return 'getCustomHookOptions'
  },
}))
