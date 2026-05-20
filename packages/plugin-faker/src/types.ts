import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { PrinterFakerNodes } from './printers/printerFaker.ts'

/**
 * Resolver for Faker that provides naming methods for mock functions.
 */
export type ResolverFaker = Resolver &
  ast.OperationParamsResolver & {
    /**
     * Resolves the faker function name for a schema.
     *
     * @example Resolving faker function names
     * `resolver.resolveName('show pet by id') // -> 'showPetById'`
     */
    resolveName(this: ResolverFaker, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the output file name for a faker module.
     *
     * @example Resolving faker file names
     * `resolver.resolvePathName('show pet by id', 'file') // -> 'showPetById'`
     */
    resolvePathName(this: ResolverFaker, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the faker function name for a request body.
     *
     * @example Resolving data function names
     * `resolver.resolveDataName(node) // -> 'createPetsData'`
     */
    resolveDataName(this: ResolverFaker, node: ast.OperationNode): string
    /**
     * Resolves the faker function name for a response by status code.
     *
     * @example Response status names
     * `resolver.resolveResponseStatusName(node, 200) // -> 'listPetsStatus200'`
     */
    resolveResponseStatusName(this: ResolverFaker, node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the faker function name for the response union.
     *
     * @example Response union names
     * `resolver.resolveResponseName(node) // -> 'listPetsResponse'`
     */
    resolveResponseName(this: ResolverFaker, node: ast.OperationNode): string
    /**
     * Resolves the faker function name for the response collection.
     *
     * @example Responses collection names
     * `resolver.resolveResponsesName(node) // -> 'listPetsResponses'`
     */
    resolveResponsesName(this: ResolverFaker, node: ast.OperationNode): string
    /**
     * Resolves the faker function name for path parameters.
     *
     * @example Path parameters names
     * `resolver.resolvePathParamsName(node, param) // -> 'showPetByIdPathPetId'`
     */
    resolvePathParamsName(this: ResolverFaker, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for query parameters.
     *
     * @example Query parameters names
     * `resolver.resolveQueryParamsName(node, param) // -> 'listPetsQueryLimit'`
     */
    resolveQueryParamsName(this: ResolverFaker, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for header parameters.
     *
     * @example Header parameters names
     * `resolver.resolveHeaderParamsName(node, param) // -> 'deletePetHeaderApiKey'`
     */
    resolveHeaderParamsName(this: ResolverFaker, node: ast.OperationNode, param: ast.ParameterNode): string
  }

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output.
   * @default { path: 'mocks', barrelType: 'named' }
   */
  output?: Output
  /**
   * Group the Faker mocks based on the provided name.
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
   * Parser to use when formatting date/time values as strings.
   *
   * @default 'faker'
   */
  dateParser?: 'faker' | 'dayjs' | 'moment' | (string & {})
  /**
   * Generator to use for RegExp patterns.
   *
   * @default 'faker'
   */
  regexGenerator?: 'faker' | 'randexp'
  /**
   * Provide per-property faker expressions keyed by property name.
   */
  mapper?: Record<string, string>
  /**
   * Locale for generating mock data.
   * Imports the matching localized `@faker-js/faker` instance so names, addresses,
   * and phone numbers reflect the target region.
   *
   * @default 'en'
   *
   * @example German
   * `locale: 'de'`
   *
   * @example Austrian German
   * `locale: 'de_AT'`
   *
   * @see https://fakerjs.dev/api/localization.html
   */
  locale?: string
  /**
   * Seed faker for deterministic output.
   */
  seed?: number | number[]
  /**
   * Apply casing to parameter names to match your configuration.
   */
  paramsCasing?: 'camelcase'
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginFaker>>
  /**
   * Override naming conventions for function names and types.
   */
  resolver?: Partial<ResolverFaker> & ThisType<ResolverFaker>
  /**
   * AST visitor to transform generated nodes.
   */
  transformer?: ast.Visitor
  /**
   * Override individual faker printer node handlers.
   */
  printer?: {
    nodes?: PrinterFakerNodes
  }
}

type ResolvedOptions = {
  output: Output
  group: Group | null
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  dateParser: NonNullable<Options['dateParser']>
  regexGenerator: NonNullable<Options['regexGenerator']>
  mapper: NonNullable<Options['mapper']>
  seed: NonNullable<Options['seed']> | undefined
  locale: Options['locale']
  paramsCasing: Options['paramsCasing']
  printer: Options['printer']
}

export type PluginFaker = PluginFactoryOptions<'plugin-faker', Options, ResolvedOptions, ResolverFaker>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-faker': PluginFaker
    }
  }
}
