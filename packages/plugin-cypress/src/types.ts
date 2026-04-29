import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'

/**
 * Resolver for Cypress that provides naming methods for test functions.
 */
export type ResolverCypress = Resolver & {
  /**
   * Resolves the function name for an operation.
   *
   * @example
   * `resolver.resolveName('show pet by id') // -> 'showPetById'`
   */
  resolveName(this: ResolverCypress, name: string): string
}

/**
 * Parameter handling mode that determines how path params and query/body params are arranged in function signatures.
 */
type ParamsTypeOptions =
  | {
      /**
       * All parameters merged into a single destructured object.
       */
      paramsType: 'object'
      /**
       * Not applicable when all parameters are merged into a single object.
       */
      pathParamsType?: never
    }
  | {
      /**
       * Each parameter group emitted as a separate function argument.
       */
      paramsType?: 'inline'
      /**
       * How path parameters are arranged: grouped in an object or spread inline.
       *
       * @default 'inline'
       */
      pathParamsType?: 'object' | 'inline'
    }

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output.
   * @default { path: 'cypress', barrelType: 'named' }
   */
  output?: Output
  /**
   * Return type when calling cy.request: response data only or full response.
   *
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * Apply casing to parameter names.
   */
  paramsCasing?: 'camelcase'
  /**
   * Base URL prepended to every generated request URL.
   */
  baseURL?: string
  /**
   * Group the Cypress requests based on the provided name.
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
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverCypress> & ThisType<ResolverCypress>
  /**
   * AST visitor to transform generated nodes.
   */
  transformer?: ast.Visitor
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginCypress>>
} & ParamsTypeOptions

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | undefined
  baseURL: Options['baseURL'] | undefined
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<NonNullable<Options['pathParamsType']>>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverCypress
}

export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, ResolverCypress>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-cypress': PluginCypress
    }
  }
}
