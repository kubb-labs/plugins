import type { ast, ResolverPatch, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'
import type { PrinterFakerNodes } from './printers/printerFaker.ts'

/**
 * Resolver for Faker that provides naming methods for mock functions.
 *
 * The top-level `name` and `file` apply the plugin's `create` prefix. Composite
 * operation naming is grouped into the `param` and `response` namespaces.
 */
export type ResolverFaker = Resolver & {
  /**
   * Naming for operation parameters, keyed by their location.
   */
  param: {
    /**
     * Resolves the faker function name for an individual parameter.
     *
     * @example Individual parameter name
     * `resolver.param.name(node, param) // -> 'showPetByIdPathPetId'`
     */
    name(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for a path parameter.
     *
     * @example Path parameter name
     * `resolver.param.path(node, param) // -> 'showPetByIdPathPetId'`
     */
    path(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for a query parameter.
     *
     * @example Query parameter name
     * `resolver.param.query(node, param) // -> 'listPetsQueryLimit'`
     */
    query(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the faker function name for a header parameter.
     *
     * @example Header parameter name
     * `resolver.param.headers(node, param) // -> 'deletePetHeaderApiKey'`
     */
    headers(node: ast.OperationNode, param: ast.ParameterNode): string
  }
  /**
   * Naming for operation request bodies and responses.
   */
  response: {
    /**
     * Resolves the faker function name for a response by status code.
     *
     * @example Response status name
     * `resolver.response.status(node, 200) // -> 'listPetsStatus200'`
     */
    status(node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the faker function name for a request body.
     *
     * @example Request body name
     * `resolver.response.body(node) // -> 'createPetsBody'`
     */
    body(node: ast.OperationNode): string
    /**
     * Resolves the faker function name for the response union.
     *
     * @example Response union name
     * `resolver.response.response(node) // -> 'listPetsResponse'`
     */
    response(node: ast.OperationNode): string
    /**
     * Resolves the faker function name for the response collection.
     *
     * @example Responses collection name
     * `resolver.response.responses(node) // -> 'listPetsResponses'`
     */
    responses(node: ast.OperationNode): string
  }
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
   * `Factory` so helpers do not clash with imported types. Pass a resolver built with
   * `createResolver`, or the plain params object it takes.
   */
  resolver?: ResolverPatch<ResolverFaker> | ResolverFaker
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

export type ResolvedOptions = {
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
