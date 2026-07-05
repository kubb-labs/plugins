import type { ClientSelector } from '@internals/client'
import type { Transformer } from '@internals/tanstack-query'
import type { ast, ResolverOverride, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

export type { Transformer } from '@internals/tanstack-query'

/**
 * The concrete resolver type for `@kubb/plugin-react-query`.
 * Extends the base `Resolver` (which provides `default` naming and option helpers, the top-level
 * `name` casing, and the `file` builder) with plugin-specific naming namespaces for the generated
 * `useQuery`, `useSuspenseQuery`, `useInfiniteQuery`, `useSuspenseInfiniteQuery`, and `useMutation`
 * hooks and their companion helpers.
 */
export type ResolverReactQuery = Resolver & {
  /**
   * Naming for the generated `useQuery` hook and its companion helpers.
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
   * Naming for the generated `useSuspenseQuery` hook and its companion helpers.
   */
  suspenseQuery: {
    /**
     * Resolves a suspense query hook function name.
     *
     * @example Suspense query hook names
     * `resolver.suspenseQuery.name(node) // → 'useGetPetByIdSuspense'`
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the suspense query options helper name.
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the suspense query key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the suspense query key type name.
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the client function name generated inline by suspense query hooks.
     */
    clientName(node: ast.OperationNode): string
  }
  /**
   * Naming for the generated `useInfiniteQuery` hook and its companion helpers.
   */
  infiniteQuery: {
    /**
     * Resolves an infinite query hook function name.
     *
     * @example Infinite query hook names
     * `resolver.infiniteQuery.name(node) // → 'useGetPetByIdInfinite'`
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the infinite query options helper name.
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the infinite query key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the infinite query key type name.
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the client function name generated inline by infinite query hooks.
     */
    clientName(node: ast.OperationNode): string
  }
  /**
   * Naming for the generated `useSuspenseInfiniteQuery` hook and its companion helpers.
   */
  suspenseInfiniteQuery: {
    /**
     * Resolves a suspense infinite query hook function name.
     *
     * @example Suspense infinite query hook names
     * `resolver.suspenseInfiniteQuery.name(node) // → 'useGetPetByIdSuspenseInfinite'`
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the suspense infinite query options helper name.
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the suspense infinite query key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the suspense infinite query key type name.
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the client function name generated inline by suspense infinite query hooks.
     */
    clientName(node: ast.OperationNode): string
  }
  /**
   * Naming for the generated `useMutation` hook and its companion helpers.
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
     * Resolves the mutation options helper name.
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the mutation key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the mutation type name.
     *
     * @example Mutation type names
     * `resolver.mutation.typeName(node) // → 'UpdatePet'`
     */
    typeName(node: ast.OperationNode): string
  }
  /**
   * Naming for the generated custom hook options file.
   */
  hook: {
    /**
     * Resolves the generated custom hook options map type name.
     */
    optionsName(): string
    /**
     * Resolves the helper function name used inside the custom hook options file.
     */
    customOptionsName(): string
  }
}

type Suspense = object

/**
 * Builds the `queryKey` used by each generated query hook.
 *
 * @note String values are inlined verbatim into generated code. Wrap literal
 * strings in `JSON.stringify(...)`.
 */
type QueryKey = Transformer

/**
 * Builds the `mutationKey` used by each generated mutation hook.
 *
 * @note String values are inlined verbatim into generated code. Wrap literal
 * strings in `JSON.stringify(...)`.
 */
type MutationKey = Transformer

type Query = {
  /**
   * HTTP methods treated as queries. Operations using these methods produce
   * `useQuery`-style hooks.
   *
   * @default ['GET']
   */
  methods?: Array<string>
  /**
   * Module specifier used in the `import { useQuery } from '...'` statement at
   * the top of every generated hook file. Useful for routing through a wrapper
   * that injects a default `queryClient`.
   *
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

type Mutation = {
  /**
   * HTTP methods treated as mutations. Operations using these methods produce
   * `useMutation`-style hooks.
   *
   * @default ['POST', 'PUT', 'PATCH', 'DELETE']
   */
  methods?: Array<string>
  /**
   * Module specifier used in the `import { useMutation } from '...'` statement
   * at the top of every generated hook file.
   *
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

export type Infinite = {
  /**
   * Name of the query parameter that holds the page cursor.
   *
   * @default 'id'
   */
  queryParam?: string
  /**
   * Path to the cursor field on the response. Leave undefined when the cursor
   * is not known.
   *
   * @deprecated Use `nextParam` and `previousParam` for richer pagination control.
   */
  cursorParam?: string | null
  /**
   * Path to the next-page cursor on the response. Supports dot notation
   * (`'pagination.next.id'`) or array form (`['pagination', 'next', 'id']`).
   */
  nextParam?: string | Array<string> | null
  /**
   * Path to the previous-page cursor on the response. Supports dot notation
   * or array form.
   */
  previousParam?: string | Array<string> | null
  /**
   * Initial value for `pageParam` on the first fetch.
   *
   * @default 0
   */
  initialPageParam?: unknown
}

type CustomOptions = {
  /**
   * Module specifier of your custom-options hook. Imported as a named import,
   * `import { ${name} } from '${importPath}'`.
   */
  importPath: string
  /**
   * Exported function name of your custom-options hook.
   *
   * @default 'useCustomHookOptions'
   */
  name?: string
}

/**
 * Where the generated hooks are written and how they are exported, plus the optional `group`
 * strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'hooks', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Selects the HTTP client the generated hooks call. Every client plugin speaks the `RequestResult`
   * contract, so the hooks call a contract `<op>` that takes one grouped `options` object.
   *
   * `'fetch'` / `'axios'` calls the `@kubb/plugin-fetch` / `@kubb/plugin-axios` functions. When a
   * single client plugin (plugin-fetch or plugin-axios) is registered it is
   * auto-detected, so the string is only needed to disambiguate several client plugins.
   *
   * A client plugin must be registered. The hooks always call its `<op>`.
   */
  client?: ClientSelector
  /**
   * Skip operations matching at least one entry in the list.
   */
  exclude?: Array<Exclude>
  /**
   * Restrict generation to operations matching at least one entry in the list.
   */
  include?: Array<Include>
  /**
   * Apply a different options object to operations matching a pattern.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Enables `useInfiniteQuery` hooks for cursor- or page-based pagination.
   * Pass an object to configure how the cursor is read, or pass `false` to skip.
   *
   * @default false
   */
  infinite?: Partial<Infinite> | false
  /**
   * Adds `useSuspenseQuery` hooks alongside the regular `useQuery` ones.
   * Pass an empty object (`{}`) to enable. TanStack Query v5+ only.
   */
  suspense?: Partial<Suspense> | false
  /**
   * Custom `queryKey` builder. Use to add a version namespace, swap to
   * operation IDs, or shape keys to match an existing invalidation strategy.
   */
  queryKey?: QueryKey
  /**
   * Configures query hooks. Set to `false` to skip generating hooks entirely
   * and emit only `queryOptions(...)` helpers.
   */
  query?: Partial<Query> | false
  /**
   * Custom `mutationKey` builder. Useful when you batch invalidations or read
   * mutation state via `useMutationState`.
   */
  mutationKey?: MutationKey
  /**
   * Configures mutation hooks. Set to `false` to skip mutation generation.
   */
  mutation?: Partial<Mutation> | false
  /**
   * Wires every generated hook through a user-supplied function that returns
   * extra options (`onSuccess`, `onError`, `select`, ...). Also emits a
   * `HookOptions` type so the wrapper stays in sync with generated hooks.
   */
  customOptions?: CustomOptions
  /**
   * Override how hook names and file paths are built. Methods you omit fall
   * back to the default `resolverReactQuery`.
   */
  resolver?: ResolverOverride<ResolverReactQuery> & ThisType<ResolverReactQuery>
  /**
   * Set to `false` to skip generating `use*` hook functions. `queryOptions`,
   * `mutationOptions`, `queryKey`, and `mutationKey` helpers are still emitted.
   * The resulting output uses only `@tanstack/react-query` factory imports
   * (`queryOptions`, `infiniteQueryOptions`, `mutationOptions`) that are
   * adapter-portable across React, Vue, Solid, and Svelte.
   *
   * @default false
   */
  hooks?: boolean
  /**
   * Macros applied to each operation node before printing.
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
  group: Group | null
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  /**
   * The resolved contract client the generators import and call.
   */
  client: ResolvedClient
  /**
   * Resolved infinite query configuration, or `false` when infinite queries are disabled.
   */
  infinite: NonNullable<Infinite> | false
  suspense: Suspense | false
  queryKey: QueryKey | null
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | null
  mutation: NonNullable<Required<Mutation>> | false
  customOptions: NonNullable<Required<CustomOptions>> | null
  hooks: boolean
  resolver: ResolverReactQuery
}

export type PluginReactQuery = PluginFactoryOptions<'plugin-react-query', Options, ResolvedOptions, ResolverReactQuery>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-react-query': PluginReactQuery
    }
  }
}
