import type { ast } from '@internals/ast'
import { ensureValidVarName } from '@internals/utils'
import { casing, operationKey } from '@kubb/kit'
import type { Resolver } from '@kubb/kit'

/**
 * The naming variant of a query namespace: the plain query, or the
 * `Suspense`/`Infinite`/`SuspenseInfinite` flavors that suffix every
 * generated identifier.
 */
export type QueryVariant = '' | 'Suspense' | 'Infinite' | 'SuspenseInfinite'

/**
 * The query namespace shared by the TanStack Query flavored plugins
 * (react-query, vue-query, swr): hook, options, key, and key type names.
 */
export type QueryResolver = {
  name(this: Resolver, node: ast.OperationNode): string
  optionsName(this: Resolver, node: ast.OperationNode): string
  keyName(this: Resolver, node: ast.OperationNode): string
  keyTypeName(this: Resolver, node: ast.OperationNode): string
}

/**
 * The mutation namespace shared by the TanStack Query flavored plugins:
 * hook and mutation key names.
 */
export type MutationResolver = {
  name(this: Resolver, node: ast.OperationNode): string
  keyName(this: Resolver, node: ast.OperationNode): string
}

/** A hook file: one of the query variants, or the mutation hook. */
export type HookFileVariant = QueryVariant | 'mutation'

export type HookFileNameOptions = { resolver: Resolver; node: ast.OperationNode; variant?: HookFileVariant }

/**
 * A hook file's name before casing, such as `useGetPetByIdSuspense`. Built from the `operationId`, not the resolver's `name`,
 * so a `name` override renames hooks and leaves their files alone. Two operations with the same name get `usePetList2`.
 */
export function hookFileName({ resolver, node, variant = '' }: HookFileNameOptions): string {
  const name = `use${casing.capitalize(ensureValidVarName(casing.camel(node.operationId)))}${variant === 'mutation' ? '' : variant}`
  return resolver.resolveName({ key: operationKey(node, 'hookFile', variant), name, scope: 'file' })
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
      const name = `use${casing.capitalize(this.name(node.operationId))}${variant}`
      return this.resolveName({ key: operationKey(node, 'query', variant, 'name'), name })
    },
    optionsName(node) {
      const name = `${this.name(node.operationId)}${variant}QueryOptions`
      return this.resolveName({ key: operationKey(node, 'query', variant, 'optionsName'), name })
    },
    keyName(node) {
      const name = `${this.name(node.operationId)}${variant}QueryKey`
      return this.resolveName({ key: operationKey(node, 'query', variant, 'keyName'), name })
    },
    keyTypeName(node) {
      const name = `${casing.capitalize(this.name(node.operationId))}${variant}QueryKey`
      return this.resolveName({ key: operationKey(node, 'query', variant, 'keyTypeName'), name })
    },
  }
}

/**
 * Builds the shared mutation namespace. Spread the result into
 * `createResolver` and add plugin-specific methods (`optionsName`,
 * `argTypeName`) next to it.
 *
 * @example
 * ```ts
 * createResolver<PluginSwr>({ mutation: { ...createMutationResolver(), argTypeName(node) {...} } })
 * ```
 */
export function createMutationResolver(): MutationResolver {
  return {
    name(node) {
      const name = `use${casing.capitalize(this.name(node.operationId))}`
      return this.resolveName({ key: operationKey(node, 'mutation', 'name'), name })
    },
    keyName(node) {
      const name = `${this.name(node.operationId)}MutationKey`
      return this.resolveName({ key: operationKey(node, 'mutation', 'keyName'), name })
    },
  }
}
