import type { ast } from '@internals/ast'
import type { ClientSelector, ResolvedContractClient } from '@internals/client'
import type { InfiniteConfig, MutationConfig, QueryConfig, KeyTransformer } from '@internals/tanstack-query'
import type { PluginOptions, ResolvedPluginOptions } from '@internals/shared/types'
import type { PluginType, Resolver, ResolverInput } from '@kubb/kit'

export type { InfiniteConfig, KeyTransformer, Transformer } from '@internals/tanstack-query'

/**
 * Resolver for Vue Query that provides naming methods for hook functions.
 */
export type ResolverVueQuery = Resolver & {
  /**
   * Names for a query operation: its `useQuery` composable, key helpers, and options helper.
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
  }
  /**
   * Names for an infinite query operation: its `useInfiniteQuery` composable, key helpers, and
   * options helper.
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
  }
  /**
   * Names for a mutation operation: its `useMutation` composable and key helper.
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
  }
}

/**
 * Builds the `queryKey` used by each generated query composable. `variant` tells which composable
 * the key is for, so infinite keys can stay apart from plain ones.
 *
 * @note String values are inlined verbatim into generated code. Wrap literal
 * strings in `JSON.stringify(...)`.
 */
export type QueryKeyTransformer = KeyTransformer

/**
 * Builds the `mutationKey` used by each generated mutation composable.
 *
 * @note String values are inlined verbatim into generated code. Wrap literal
 * strings in `JSON.stringify(...)`.
 */
export type MutationKeyTransformer = KeyTransformer

/**
 * Where the generated composables are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'hooks', barrel: { type: 'named' } }
 */
export type PluginVueQueryOptions = PluginOptions<PluginVueQueryResolvedOptions> & {
  /**
   * Selects the HTTP client the generated composables call. Every client plugin speaks the `RequestResult`
   * contract, so the composables call a contract `<op>` that takes one grouped `options` object.
   *
   * - `'fetch'` / `'axios'` / `'ky'` / `'client'` calls the `@kubb/plugin-fetch` / `@kubb/plugin-axios` / `@kubb/plugin-ky` /
   *   `@kubb/plugin-client` functions. When a single client plugin is registered it is
   *   auto-detected, so the string is only needed to disambiguate several client plugins.
   *
   * A client plugin must be registered. The composables always call its `<op>`.
   */
  client?: ClientSelector
  /**
   * Shape of the value the hooks resolve to: `'data'` is the success body, `'full'` the client's whole `RequestResult` so a hook can read response headers. `'full'` needs a client plugin whose own `returnType` is `'full'` or `'plain'`.
   * @default 'data'
   */
  returnType?: 'data' | 'full'
  /**
   * Enables `useInfiniteQuery` composables for cursor- or page-based pagination.
   * Pass an object to configure how the cursor is read, or pass `false` to skip.
   *
   * @default false
   */
  infinite?: Partial<InfiniteConfig> | false
  /**
   * Custom `queryKey` builder.
   */
  queryKey?: QueryKeyTransformer
  /**
   * Configures query composables. Set to `false` to skip the query output.
   */
  query?: Partial<QueryConfig> | false
  /**
   * Custom `mutationKey` builder.
   */
  mutationKey?: MutationKeyTransformer
  /**
   * Configures mutation composables. Set to `false` to skip mutation generation.
   */
  mutation?: Partial<MutationConfig> | false
  /**
   * Override how composable names and file paths are built.
   */
  resolver?: ResolverInput<ResolverVueQuery>
  /**
   * Set to `true` to also generate `use*` composable functions. By default only the
   * `queryOptions`, `queryKey`, and `mutationKey` helpers are emitted.
   *
   * @default false
   */
  hooks?: boolean
  /**
   * Macros applied to each operation node before printing.
   */
  macros?: Array<ast.Macro>
}

export type PluginVueQueryResolvedOptions = ResolvedPluginOptions<PluginVueQueryResolvedOptions> & {
  /**
   * The resolved contract client the generators import and call.
   */
  client: ResolvedContractClient
  returnType?: 'data' | 'full'
  /**
   * Resolved infinite query configuration, or `false` when infinite queries are disabled.
   */
  infinite: NonNullable<InfiniteConfig> | false
  queryKey: QueryKeyTransformer | null
  query: NonNullable<Required<QueryConfig>> | false
  mutationKey: MutationKeyTransformer | null
  mutation: NonNullable<Required<MutationConfig>> | false
  hooks: boolean
  resolver: ResolverVueQuery
}

export type PluginVueQuery = PluginType<'plugin-vue-query', PluginVueQueryOptions, PluginVueQueryResolvedOptions, ResolverVueQuery>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-vue-query': PluginVueQuery
    }
  }
}
