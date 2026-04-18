import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver, UserGroup } from '@kubb/core'
import type { PrinterFakerNodes } from './printers/printerFaker.ts'

/**
 * Default resolver contract for `@kubb/plugin-faker`.
 */
export type ResolverFaker = Resolver &
  ast.OperationParamsResolver & {
    /**
     * Resolves the generated faker function name for a named schema.
     * @example
     * resolver.resolveName('show pet by id') // -> 'showPetById'
     */
    resolveName(this: ResolverFaker, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the output file name/path for a generated faker module.
     * @example
     * resolver.resolvePathName('show pet by id', 'file') // -> 'showPetById'
     */
    resolvePathName(this: ResolverFaker, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the faker function name for an operation request body.
     * @example
     * resolver.resolveDataName(node) // -> 'createPetsData'
     */
    resolveDataName(this: ResolverFaker, node: ast.OperationNode): string
    /**
     * Resolves the faker function name for an operation response by status code.
     * @example
     * resolver.resolveResponseStatusName(node, 200) // -> 'listPetsStatus200'
     */
    resolveResponseStatusName(this: ResolverFaker, node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the faker function name for the operation response union.
     * @example
     * resolver.resolveResponseName(node) // -> 'listPetsResponse'
     */
    resolveResponseName(this: ResolverFaker, node: ast.OperationNode): string
    /**
     * Resolves the faker function name for grouped path params or a single path param.
     * @example
     * resolver.resolvePathParamsName(node, param) // -> 'showPetByIdPathPetId'
     */
    resolvePathParamsName(this: ResolverFaker, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for grouped query params or a single query param.
     * @example
     * resolver.resolveQueryParamsName(node, param) // -> 'listPetsQueryLimit'
     */
    resolveQueryParamsName(this: ResolverFaker, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for grouped header params or a single header param.
     * @example
     * resolver.resolveHeaderParamsName(node, param) // -> 'deletePetHeaderApiKey'
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
  group?: UserGroup
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Which parser should be used when date/time values are represented as strings.
   * - 'faker' uses faker's built-in ISO formatting.
   * - 'dayjs' uses dayjs for custom formatting.
   * - 'moment' uses moment for custom formatting.
   * @default 'faker'
   */
  dateParser?: 'faker' | 'dayjs' | 'moment' | (string & {})
  /**
   * Choose which generator to use when using RegExp patterns.
   * - 'faker' uses faker.helpers.fromRegExp.
   * - 'randexp' uses RandExp.
   * @default 'faker'
   */
  regexGenerator?: 'faker' | 'randexp'
  /**
   * Provide per-property faker expressions keyed by property name.
   */
  mapper?: Record<string, string>
  /**
   * Seed faker for deterministic output.
   */
  seed?: number | number[]
  /**
   * Transform parameter names to a specific casing format.
   * When set to 'camelcase', parameter names in path, query, and header params will be transformed to camelCase.
   * This should match the paramsCasing setting used in @kubb/plugin-ts.
   * @default undefined
   */
  paramsCasing?: 'camelcase'
  /**
   * Define additional generators next to the faker generators.
   */
  generators?: Array<Generator<PluginFaker>>
  /**
   * Override individual resolver methods. Any method you omit falls back to the
   * active preset resolver.
   */
  resolver?: Partial<ResolverFaker> & ThisType<ResolverFaker>
  /**
   * Single AST visitor applied to each node before rendering.
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
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  dateParser: NonNullable<Options['dateParser']>
  regexGenerator: NonNullable<Options['regexGenerator']>
  mapper: NonNullable<Options['mapper']>
  seed: NonNullable<Options['seed']> | undefined
  paramsCasing: Options['paramsCasing']
  printer: Options['printer']
}

export type PluginFaker = PluginFactoryOptions<'plugin-faker', Options, ResolvedOptions, never, object, ResolverFaker>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-faker': PluginFaker
    }
  }
}
