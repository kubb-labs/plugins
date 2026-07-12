import { capitalize } from '@internals/utils'
import type { ast, Resolver } from 'kubb/kit'

/**
 * The naming variant of a query namespace: the plain query, or the
 * `Suspense`/`Infinite`/`SuspenseInfinite` flavors that suffix every
 * generated identifier.
 */
export type QueryVariant = '' | 'Suspense' | 'Infinite' | 'SuspenseInfinite'

/**
 * The query namespace shared by the TanStack Query flavored plugins
 * (react-query, vue-query, swr): hook, options, key, key type, and inline
 * client names.
 */
export type QueryResolver = {
  name(this: Resolver, node: ast.OperationNode): string
  optionsName(this: Resolver, node: ast.OperationNode): string
  keyName(this: Resolver, node: ast.OperationNode): string
  keyTypeName(this: Resolver, node: ast.OperationNode): string
  clientName(this: Resolver, node: ast.OperationNode): string
}

/**
 * The mutation namespace shared by the TanStack Query flavored plugins:
 * hook and mutation key names.
 */
export type MutationResolver = {
  name(this: Resolver, node: ast.OperationNode): string
  keyName(this: Resolver, node: ast.OperationNode): string
}

/**
 * Builds the shared query namespace for a variant. Spread the result into
 * `createResolver` once per variant the plugin supports.
 *
 * @example
 * ```ts
 * createResolver<PluginReactQuery>({
 *   query: createQueryResolver(),
 *   suspenseQuery: createQueryResolver('Suspense'),
 * })
 * ```
 */
export function createQueryResolver(variant: QueryVariant = ''): QueryResolver {
  return {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}${variant}`
    },
    optionsName(node) {
      return `${this.name(node.operationId)}${variant}QueryOptions`
    },
    keyName(node) {
      return `${this.name(node.operationId)}${variant}QueryKey`
    },
    keyTypeName(node) {
      return `${capitalize(this.name(node.operationId))}${variant}QueryKey`
    },
    clientName(node) {
      return `${this.name(node.operationId)}${variant}`
    },
  }
}

/**
 * Builds the shared mutation namespace. Spread the result into
 * `createResolver` and add plugin-specific methods (`optionsName`,
 * `typeName`, `argTypeName`) next to it.
 *
 * @example
 * ```ts
 * createResolver<PluginSwr>({ mutation: { ...createMutationResolver(), argTypeName(node) {...} } })
 * ```
 */
export function createMutationResolver(): MutationResolver {
  return {
    name(node) {
      return `use${capitalize(this.name(node.operationId))}`
    },
    keyName(node) {
      return `${this.name(node.operationId)}MutationKey`
    },
  }
}
