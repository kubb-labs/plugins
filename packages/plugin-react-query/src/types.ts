import type { Transformer } from '@internals/tanstack-query'
import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
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
   * @default ['get']
   */
  methods?: Array<string>
  /**
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

type Mutation = {
  /**
   * HTTP methods to use for mutations.
   *
   * @default ['post', 'put', 'delete']
   */
  methods?: Array<string>
  /**
   * Path to the useMutation hook for useMutation functionality.
   * Used as `import { useMutation } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

export type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * @default 'id'
   */
  queryParam: string
  /**
   * Which field of the data is used, set it to undefined when no cursor is known.
   * @deprecated Use `nextParam` and `previousParam` instead for more flexible pagination handling.
   */
  cursorParam?: string | undefined
  /**
   * Which field of the data is used to get the cursor for the next page.
   * Supports dot notation (e.g. 'pagination.next.id') or array path (e.g. ['pagination', 'next', 'id']) to access nested fields.
   */
  nextParam?: string | string[] | undefined
  /**
   * Which field of the data is used to get the cursor for the previous page.
   * Supports dot notation (e.g. 'pagination.prev.id') or array path (e.g. ['pagination', 'prev', 'id']) to access nested fields.
   */
  previousParam?: string | string[] | undefined
  /**
   * The initial value, the value of the first page.
   * @default 0
   */
  initialPageParam: unknown
}

type CustomOptions = {
  /**
   * Path to the hook that is used to customize the hook options.
   * It used as `import ${customOptions.name} from '${customOptions.importPath}'`.
   * It allows both relative and absolute paths but be aware that we will not change the path.
   */
  importPath: string
  /**
   * Name of the exported hook that is used to customize the hook options.
   * It used as `import ${customOptions.name} from '${customOptions.importPath}'`.
   * @default 'useCustomHookOptions'
   */
  name?: string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'hooks', barrelType: 'named' }
   */
  output?: Output
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  group?: Group
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
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
   * Apply casing to parameter names.
   */
  paramsCasing?: 'camelcase'
  /**
   * How parameters are passed: grouped in an object or spread inline.
   *
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How path parameters are passed: grouped in an object or spread inline.
   *
   * @default 'inline'
   */
  pathParamsType?: PluginClient['options']['pathParamsType']
  /**
   * Add infinite query hooks.
   */
  infinite?: Partial<Infinite> | false
  /**
   * Add suspense query hooks.
   */
  suspense?: Partial<Suspense> | false
  queryKey?: QueryKey
  /**
   * Configure useQuery behavior.
   */
  query?: Partial<Query> | false
  mutationKey?: MutationKey
  /**
   * Configure useMutation behavior.
   */
  mutation?: Partial<Mutation> | false
  /**
   * Use a custom hook to customize hook options and generate a HookOptions type.
   */
  customOptions?: CustomOptions
  /**
   * Parser to use for validating response data.
   */
  parser?: PluginClient['options']['parser']
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverReactQuery> & ThisType<ResolverReactQuery>
  /**
   * AST visitor to transform generated nodes.
   */
  transformer?: ast.Visitor
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginReactQuery>>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  parser: Required<NonNullable<Options['parser']>>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  /**
   * Only used for infinite
   */
  infinite: NonNullable<Infinite> | false
  suspense: Suspense | false
  queryKey: QueryKey | undefined
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | undefined
  mutation: NonNullable<Required<Mutation>> | false
  customOptions: NonNullable<Required<CustomOptions>> | undefined
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
