import type { OperationParamsResolver } from '@internals/shared'
import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { PrinterFakerNodes } from './printers/printerFaker.ts'

/**
 * Resolver for Faker that provides naming methods for mock functions.
 */
export type ResolverFaker = Resolver &
  OperationParamsResolver & {
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

/**
 * Where the generated mock factories are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'mocks', barrel: { type: 'named' } }
 */
export type Options = OutputOptions & {
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
   * Library used to format string-represented date, time, and datetime fields.
   * Any library exporting a default function works; Kubb adds the import for you.
   *
   * @default 'faker'
   */
  dateParser?: 'faker' | 'dayjs' | 'moment' | (string & {})
  /**
   * Library used to generate strings that satisfy a regex `pattern` keyword.
   * - `'faker'` uses `faker.helpers.fromRegExp`. No extra dependency.
   * - `'randexp'` uses the `randexp` package. Supports a wider regex grammar.
   *
   * @default 'faker'
   */
  regexGenerator?: 'faker' | 'randexp'
  /**
   * Faker locale code. Switches the named import to `fakerXX` from `@faker-js/faker`
   * so names, addresses, and phone numbers reflect the target region.
   *
   * @default 'en'
   * @example German
   * `locale: 'de'`
   * @example Austrian German
   * `locale: 'de_AT'`
   * @see https://fakerjs.dev/api/localization.html
   */
  locale?: string
  /**
   * Value passed to `faker.seed(...)`. Set this for deterministic mock output,
   * which is useful for snapshot tests.
   */
  seed?: number | Array<number>
  /**
   * Override the naming of generated factory helpers. Common use: append `Mock` or
   * `Factory` so helpers do not clash with imported types.
   */
  resolver?: Partial<ResolverFaker> & ThisType<ResolverFaker>
  /**
   * Macros applied to schema and operation nodes before printing.
   */
  macros?: Array<ast.Macro>
  /**
   * Replace the Faker handler for a specific schema type (`'integer'`, `'date'`, ...).
   * Each handler returns the Faker expression as a string.
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
  seed: NonNullable<Options['seed']> | undefined
  locale: Options['locale']
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
