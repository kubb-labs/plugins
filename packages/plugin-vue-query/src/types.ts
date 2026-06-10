import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

export type Transformer = (props: { node: ast.OperationNode; casing: 'camelcase' | undefined }) => Array<unknown>

/**
 * Resolver for Vue Query that provides naming methods for hook functions.
 */
export type ResolverVueQuery = Resolver & {
  /**
   * Resolves the base function name for an operation.
   */
  resolveName(this: ResolverVueQuery, name: string): string
  /**
   * Resolves the output file name for a hook module.
   */
  resolvePathName(this: ResolverVueQuery, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves a query hook function name.
   */
  resolveQueryName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves an infinite query hook function name.
   */
  resolveInfiniteQueryName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves a mutation hook function name.
   */
  resolveMutationName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the query options helper name.
   */
  resolveQueryOptionsName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the infinite query options helper name.
   */
  resolveInfiniteQueryOptionsName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the query key helper name.
   */
  resolveQueryKeyName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the infinite query key helper name.
   */
  resolveInfiniteQueryKeyName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the mutation key helper name.
   */
  resolveMutationKeyName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the query key type name.
   */
  resolveQueryKeyTypeName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the infinite query key type name.
   */
  resolveInfiniteQueryKeyTypeName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the mutation type name.
   */
  resolveMutationTypeName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by query hooks.
   */
  resolveClientName(this: ResolverVueQuery, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by infinite query hooks.
   */
  resolveInfiniteClientName(this: ResolverVueQuery, node: ast.OperationNode): string
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
   * @default ['get']
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
   * @default ['post', 'put', 'delete']
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
   * HTTP client used inside every generated composable. Mirrors a subset of
   * `pluginClient` options.
   */
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
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
   * Rename parameter properties in the generated composables.
   *
   * @note Must match the value of `paramsCasing` on `@kubb/plugin-ts`.
   */
  paramsCasing?: 'camelcase'
  /**
   * How operation parameters appear in the generated composable signature.
   *
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How URL path parameters are arranged inside the inline argument list.
   *
   * @default 'inline'
   */
  pathParamsType?: PluginClient['options']['pathParamsType']
  /**
   * Enables `useInfiniteQuery` composables for cursor- or page-based pagination.
   * Pass an object to configure how the cursor is read; pass `false` to skip.
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
   * Validator applied to response bodies before they reach the caller.
   * - `'client'` — no validation.
   * - `'zod'` — pipes responses through schemas from `@kubb/plugin-zod`.
   */
  parser?: PluginClient['options']['parser']
  /**
   * Override how composable names and file paths are built.
   */
  resolver?: Partial<ResolverVueQuery> & ThisType<ResolverVueQuery>
  /**
   * AST visitor applied to each operation node before printing.
   */
  transformer?: ast.Visitor
  /**
   * Custom generators that run alongside the built-in Vue Query generators.
   */
  generators?: Array<Generator<PluginVueQuery>>
}

type ResolvedOptions = {
  output: Output
  group: Group | null
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  parser: NonNullable<Options['parser']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  /**
   * Only used for infinite
   */
  infinite: NonNullable<Infinite> | false
  queryKey: QueryKey | null
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | null
  mutation: NonNullable<Required<Mutation>> | false
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
