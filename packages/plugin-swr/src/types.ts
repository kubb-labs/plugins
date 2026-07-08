import type { ClientSelector } from '@internals/client'
import type { Transformer } from '@internals/tanstack-query'
import type { ast, ResolverPatch, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

export type { Transformer } from '@internals/tanstack-query'

/**
 * The concrete resolver type for `@kubb/plugin-swr`.
 * Extends the base `Resolver` (which provides `default` naming and option helpers, the top-level
 * `name` casing, and the `file` builder) with plugin-specific naming namespaces for the generated
 * `useSWR` and `useSWRMutation` hooks and their companion helpers.
 */
export type ResolverSwr = Resolver & {
  /**
   * Naming for the generated `useSWR` hook and its companion helpers.
   */
  query: {
    /**
     * Resolves a query hook function name.
     *
     * @example Query hook names
     * `resolver.query.name(node) // → 'useGetPetById'`
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the query options helper name.
     *
     * @example Query options helper names
     * `resolver.query.optionsName(node) // → 'getPetByIdQueryOptions'`
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the query key helper name.
     *
     * @example Query key helper names
     * `resolver.query.keyName(node) // → 'getPetByIdQueryKey'`
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the query key type name.
     *
     * @example Query key type names
     * `resolver.query.keyTypeName(node) // → 'GetPetByIdQueryKey'`
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the client function name generated inline by query hooks.
     *
     * @example Client function names
     * `resolver.query.clientName(node) // → 'getPetById'`
     */
    clientName(node: ast.OperationNode): string
  }
  /**
   * Naming for the generated `useSWRMutation` hook and its companion helpers.
   */
  mutation: {
    /**
     * Resolves a mutation hook function name.
     *
     * @example Mutation hook names
     * `resolver.mutation.name(node) // → 'useUpdatePet'`
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the mutation key helper name.
     *
     * @example Mutation key helper names
     * `resolver.mutation.keyName(node) // → 'updatePetMutationKey'`
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the mutation key type name.
     *
     * @example Mutation key type names
     * `resolver.mutation.keyTypeName(node) // → 'UpdatePetMutationKey'`
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the mutation argument type name emitted alongside the mutation hook.
     *
     * @example Mutation argument type names
     * `resolver.mutation.argTypeName(node) // → 'UpdatePetMutationArg'`
     */
    argTypeName(node: ast.OperationNode): string
  }
}

/**
 * Customize the queryKey.
 */
type QueryKey = Transformer

/**
 * Customize the mutationKey.
 */
type MutationKey = Transformer

type Query = {
  /**
   * HTTP methods to use for queries.
   *
   * @default ['GET']
   */
  methods?: Array<string>
  /**
   * Path to the useSWR hook for useSWR functionality.
   * Used as `import useSWR from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is. Relative paths are based on the generated file location.
   * @default 'swr'
   */
  importPath?: string
}

type Mutation = {
  /**
   * HTTP methods to use for mutations.
   *
   * @default ['POST', 'PUT', 'PATCH', 'DELETE']
   */
  methods?: Array<string>
  /**
   * Path to the useSWRMutation hook for useSWRMutation functionality.
   * Used as `import useSWRMutation from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is. Relative paths are based on the generated file location.
   * @default 'swr/mutation'
   */
  importPath?: string
}

/**
 * Where the generated SWR hooks are written and how they are exported, plus the optional `group`
 * strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'hooks', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Selects the HTTP client the generated hooks call. Every client plugin speaks the `RequestResult`
   * contract, so the hooks call a contract `<op>` that takes one grouped `options` object.
   *
   * - `'fetch'` / `'axios'` calls the `@kubb/plugin-fetch` / `@kubb/plugin-axios` functions. When a
   *   single client plugin (plugin-fetch or plugin-axios) is registered it is
   *   auto-detected, so the string is only needed to disambiguate several client plugins.
   *
   * A client plugin must be registered. The hooks always call its `<op>`.
   */
  client?: ClientSelector
  /**
   * Tags, operations, or paths to exclude from generation.
   */
  exclude?: Array<Exclude>
  /**
   * Tags, operations, or paths to include in generation.
   */
  include?: Array<Include>
  /**
   * Override options for specific tags, operations, or paths.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Custom `queryKey` builder. Use to add a version namespace, swap to
   * operation IDs, or shape keys to match an existing invalidation strategy.
   */
  queryKey?: QueryKey
  /**
   * Configure useSWR behavior.
   */
  query?: Partial<Query> | false
  /**
   * Custom `mutationKey` builder. Useful when you match keys from SWR's
   * global `mutate` for cache updates.
   */
  mutationKey?: MutationKey
  /**
   * Configure useSWRMutation behavior.
   */
  mutation?: Partial<Mutation> | false
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: ResolverPatch<ResolverSwr> | ResolverSwr
  /**
   * Macros that rewrite generated nodes before printing.
   */
  macros?: Array<ast.Macro>
}

/**
 * The resolved client strategy for the generated hooks, computed once during setup. The hooks always
 * import and call a registered contract client plugin's `<op>`.
 */
export type ResolvedClient = { kind: 'contract'; pluginName: string }

export type ResolvedOptions = {
  output: Output
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  /**
   * The resolved contract client the generators import and call.
   */
  client: ResolvedClient
  queryKey: QueryKey | undefined
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | undefined
  mutation: NonNullable<Required<Mutation>> | false
  resolver: ResolverSwr
}

export type PluginSwr = PluginFactoryOptions<'plugin-swr', Options, ResolvedOptions, ResolverSwr>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-swr': PluginSwr
    }
  }
}
