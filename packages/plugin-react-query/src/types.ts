import type { Transformer } from '@internals/tanstack-query'
import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

export type { Transformer } from '@internals/tanstack-query'

/**
 * Resolver for React Query that provides naming methods for hook functions.
 */
export type ResolverReactQuery = Resolver & {
  /**
   * Resolves the base function name for an operation.
   *
   * @example Resolving base operation names
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverReactQuery, name: string): string
  /**
   * Resolves the output file name for a hook module.
   */
  resolvePathName(this: ResolverReactQuery, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves a query hook function name.
   */
  resolveQueryName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves a suspense query hook function name.
   */
  resolveSuspenseQueryName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves an infinite query hook function name.
   */
  resolveInfiniteQueryName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves a suspense infinite query hook function name.
   */
  resolveSuspenseInfiniteQueryName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves a mutation hook function name.
   */
  resolveMutationName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the query options helper name.
   */
  resolveQueryOptionsName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the suspense query options helper name.
   */
  resolveSuspenseQueryOptionsName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the infinite query options helper name.
   */
  resolveInfiniteQueryOptionsName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the suspense infinite query options helper name.
   */
  resolveSuspenseInfiniteQueryOptionsName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the mutation options helper name.
   */
  resolveMutationOptionsName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the query key helper name.
   */
  resolveQueryKeyName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the suspense query key helper name.
   */
  resolveSuspenseQueryKeyName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the infinite query key helper name.
   */
  resolveInfiniteQueryKeyName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the suspense infinite query key helper name.
   */
  resolveSuspenseInfiniteQueryKeyName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the mutation key helper name.
   */
  resolveMutationKeyName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the query key type name.
   */
  resolveQueryKeyTypeName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the suspense query key type name.
   */
  resolveSuspenseQueryKeyTypeName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the infinite query key type name.
   */
  resolveInfiniteQueryKeyTypeName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the suspense infinite query key type name.
   */
  resolveSuspenseInfiniteQueryKeyTypeName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the mutation type name.
   */
  resolveMutationTypeName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by query hooks.
   */
  resolveClientName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by suspense query hooks.
   */
  resolveSuspenseClientName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by infinite query hooks.
   */
  resolveInfiniteClientName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by suspense infinite query hooks.
   */
  resolveSuspenseInfiniteClientName(this: ResolverReactQuery, node: ast.OperationNode): string
  /**
   * Resolves the generated custom hook options map type name.
   */
  resolveHookOptionsName(this: ResolverReactQuery): string
  /**
   * Resolves the helper function name used inside the custom hook options file.
   */
  resolveCustomHookOptionsName(this: ResolverReactQuery): string
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
   * @default ['get']
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
   * @default ['post', 'put', 'delete']
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
   * Module specifier of your custom-options hook. Imported as
   * `import ${name} from '${importPath}'`.
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
   * HTTP client used inside every generated hook. Mirrors a subset of
   * `pluginClient` options.
   */
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'throwOnError' | 'baseURL' | 'bundle' | 'paramsCasing'>
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
   * Rename parameter properties in the generated hooks.
   *
   * @note Must match the value of `paramsCasing` on `@kubb/plugin-ts`.
   */
  paramsCasing?: 'camelcase'
  /**
   * How operation parameters appear in the generated hook signature.
   * - `'inline'` — positional arguments.
   * - `'object'` — single destructured object argument.
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
   * Enables `useInfiniteQuery` hooks for cursor- or page-based pagination.
   * Pass an object to configure how the cursor is read; pass `false` to skip.
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
   * Validator applied to response bodies before they reach the caller.
   * - `'client'` — no validation. Trusts the API.
   * - `'zod'` — pipes responses through schemas from `@kubb/plugin-zod`.
   */
  parser?: PluginClient['options']['parser']
  /**
   * Override how hook names and file paths are built. Methods you omit fall
   * back to the default `resolverReactQuery`.
   */
  resolver?: Partial<ResolverReactQuery> & ThisType<ResolverReactQuery>
  /**
   * AST visitor applied to each operation node before printing.
   */
  transformer?: ast.Visitor
  /**
   * Custom generators that run alongside the built-in React Query generators.
   */
  generators?: Array<Generator<PluginReactQuery>>
}

type ResolvedOptions = {
  output: Output
  group: Group | null
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'throwOnError' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  parser: NonNullable<Options['parser']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  /**
   * Only used for infinite
   */
  infinite: NonNullable<Infinite> | false
  suspense: Suspense | false
  queryKey: QueryKey | null
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | null
  mutation: NonNullable<Required<Mutation>> | false
  customOptions: NonNullable<Required<CustomOptions>> | null
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
