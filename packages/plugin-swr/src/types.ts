import type { Transformer } from '@internals/tanstack-query'
import type { ast, Exclude, Generator, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

export type { Transformer } from '@internals/tanstack-query'

/**
 * Resolver for SWR that provides naming methods for hook functions.
 */
export type ResolverSwr = Resolver & {
  /**
   * Resolves the base function name for an operation.
   *
   * @example Resolving base operation names
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverSwr, name: string): string
  /**
   * Resolves the output file name for a hook module.
   */
  resolvePathName(this: ResolverSwr, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves a query hook function name.
   */
  resolveQueryName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves a mutation hook function name.
   */
  resolveMutationName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the query options helper name.
   */
  resolveQueryOptionsName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the query key helper name.
   */
  resolveQueryKeyName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the mutation key helper name.
   */
  resolveMutationKeyName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the query key type name.
   */
  resolveQueryKeyTypeName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the mutation key type name.
   */
  resolveMutationKeyTypeName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the mutation argument type name emitted alongside the mutation hook.
   */
  resolveMutationArgTypeName(this: ResolverSwr, node: ast.OperationNode): string
  /**
   * Resolves the client function name generated inline by query hooks.
   */
  resolveClientName(this: ResolverSwr, node: ast.OperationNode): string
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
   * @default ['get']
   */
  methods?: Array<string>
  /**
   * Path to the useSWR hook for useSWR functionality.
   * Used as `import useSWR from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default 'swr'
   */
  importPath?: string
}

type Mutation = {
  /**
   * HTTP methods to use for mutations.
   *
   * @default ['post', 'put', 'delete', 'patch']
   */
  methods?: Array<string>
  /**
   * Path to the useSWRMutation hook for useSWRMutation functionality.
   * Used as `import useSWRMutation from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
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
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'paramsCasing'>
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
  queryKey?: QueryKey
  /**
   * Configure useSWR behavior.
   */
  query?: Partial<Query> | false
  mutationKey?: MutationKey
  /**
   * Configure useSWRMutation behavior.
   */
  mutation?: Partial<Mutation> | false
  /**
   * Parser to use for validating response data.
   */
  parser?: PluginClient['options']['parser']
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverSwr> & ThisType<ResolverSwr>
  /**
   * Macros that rewrite generated nodes before printing.
   */
  macros?: Array<ast.Macro>
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginSwr>>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'paramsCasing'>
  parser: NonNullable<Options['parser']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
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
