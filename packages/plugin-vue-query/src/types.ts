import type { ClientSelector } from '@internals/client'
import type { ast, ResolverPatch, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

/**
 * Builds the parts of a query or mutation key for one operation. Receives the operation node and
 * the resolved `paramsCasing` setting and returns the key elements in order.
 */
export type Transformer = (props: { node: ast.OperationNode; casing: 'camelcase' | undefined }) => Array<unknown>

/**
 * Resolver for Vue Query that provides naming methods for hook functions.
 */
export type ResolverVueQuery = Resolver & {
  /**
   * Names for a query operation: its `useQuery` composable, key helpers, options helper, and the
   * inline client function it calls.
   */
  query: {
    /**
     * Resolves a query hook function name.
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the query key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the query key type name.
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the query options helper name.
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the client function name generated inline by query hooks.
     */
    clientName(node: ast.OperationNode): string
  }
  /**
   * Names for an infinite query operation: its `useInfiniteQuery` composable, key helpers, options
   * helper, and the inline client function it calls.
   */
  infiniteQuery: {
    /**
     * Resolves an infinite query hook function name.
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the infinite query key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the infinite query key type name.
     */
    keyTypeName(node: ast.OperationNode): string
    /**
     * Resolves the infinite query options helper name.
     */
    optionsName(node: ast.OperationNode): string
    /**
     * Resolves the client function name generated inline by infinite query hooks.
     */
    clientName(node: ast.OperationNode): string
  }
  /**
   * Names for a mutation operation: its `useMutation` composable, key helper, and type name.
   */
  mutation: {
    /**
     * Resolves a mutation hook function name.
     */
    name(node: ast.OperationNode): string
    /**
     * Resolves the mutation key helper name.
     */
    keyName(node: ast.OperationNode): string
    /**
     * Resolves the mutation type name.
     */
    typeName(node: ast.OperationNode): string
  }
}

/**
 * Builds the `queryKey` used by each generated query composable.
 *
 * @note String values are inlined verbatim into generated code. Wrap literal
 * strings in `JSON.stringify(...)`.
 */
type QueryKey = Transformer

/**
 * Builds the `mutationKey` used by each generated mutation composable.
 *
 * @note String values are inlined verbatim into generated code. Wrap literal
 * strings in `JSON.stringify(...)`.
 */
type MutationKey = Transformer

type Query = {
  /**
   * HTTP methods treated as queries.
   *
   * @default ['GET']
   */
  methods?: Array<string>
  /**
   * Module specifier used in the `import { useQuery } from '...'` statement at
   * the top of every generated composable file.
   *
   * @default '@tanstack/vue-query'
   */
  importPath?: string
}

type Mutation = {
  /**
   * HTTP methods treated as mutations.
   *
   * @default ['POST', 'PUT', 'PATCH', 'DELETE']
   */
  methods?: Array<string>
  /**
   * Module specifier used in the `import { useMutation } from '...'` statement
   * at the top of every generated composable file.
   *
   * @default '@tanstack/vue-query'
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
   * (`'pagination.next.id'`) or array form.
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

/**
 * Where the generated composables are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'hooks', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
  /**
   * Selects the HTTP client the generated composables call. Every client plugin speaks the `RequestResult`
   * contract, so the composables call a contract `<op>` that takes one grouped `options` object.
   *
   * - `'fetch'` / `'axios'` calls the `@kubb/plugin-fetch` / `@kubb/plugin-axios` functions. When a
   *   single client plugin (plugin-fetch or plugin-axios) is registered it is
   *   auto-detected, so the string is only needed to disambiguate several client plugins.
   *
   * A client plugin must be registered. The composables always call its `<op>`.
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
   * Enables `useInfiniteQuery` composables for cursor- or page-based pagination.
   * Pass an object to configure how the cursor is read, or pass `false` to skip.
   *
   * @default false
   */
  infinite?: Partial<Infinite> | false
  /**
   * Custom `queryKey` builder.
   */
  queryKey?: QueryKey
  /**
   * Configures query composables. Set to `false` to skip composable generation
   * and emit only `queryOptions(...)` helpers.
   */
  query?: Partial<Query> | false
  /**
   * Custom `mutationKey` builder.
   */
  mutationKey?: MutationKey
  /**
   * Configures mutation composables. Set to `false` to skip mutation generation.
   */
  mutation?: Partial<Mutation> | false
  /**
   * Override how composable names and file paths are built.
   */
  resolver?: ResolverPatch<ResolverVueQuery>
  /**
   * Set to `false` to skip generating `use*` composable functions. `queryOptions`,
   * `queryKey`, and `mutationKey` helpers are still emitted.
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
 * The resolved client strategy for the generated composables, computed once during setup. The
 * composables always import and call a registered contract client plugin's `<op>`.
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
  queryKey: QueryKey | null
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | null
  mutation: NonNullable<Required<Mutation>> | false
  hooks: boolean
  resolver: ResolverVueQuery
}

export type PluginVueQuery = PluginFactoryOptions<'plugin-vue-query', Options, ResolvedOptions, ResolverVueQuery>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-vue-query': PluginVueQuery
    }
  }
}
