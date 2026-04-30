import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, ResolveNameParams, Resolver } from '@kubb/core'

/**
 * Resolver for MSW that provides naming methods for handler functions.
 */
export type ResolverMsw = Resolver & {
  /**
   * Resolves the handler function name for an operation.
   */
  resolveName(this: ResolverMsw, name: string): string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'handlers', barrelType: 'named' }
   */
  output?: Output
  baseURL?: string
  /**
   * Group the MSW mocks based on the provided name.
   */
  group?: Group
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
  transformers?: {
    /**
     * Override the default naming for handlers.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverMsw> & ThisType<ResolverMsw>
  /**
   * AST visitor to transform generated nodes.
   */
  transformer?: ast.Visitor
  /**
   * Create `handlers.ts` file with all handlers grouped by methods.
   * @default false
   */
  handlers?: boolean
  /**
   * Which parser to use for generating response data.
   *
   * @default 'data'
   */
  parser?: 'data' | 'faker'
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginMsw>>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  parser: NonNullable<Options['parser']>
  baseURL: Options['baseURL'] | undefined
  handlers: boolean
  transformers: NonNullable<Options['transformers']>
  resolver: ResolverMsw
}

export type PluginMsw = PluginFactoryOptions<'plugin-msw', Options, ResolvedOptions, ResolverMsw>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-msw': PluginMsw
    }
  }
}
