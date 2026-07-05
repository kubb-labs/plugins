import type { ast, ResolverOverride, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'
import type { PrinterZodNodes } from './printers/printerZod.ts'
import type { PrinterZodMiniNodes } from './printers/printerZodMini.ts'

/**
 * Resolver for Zod that provides naming methods for schema types.
 *
 * The top-level `name` resolves a camelCase schema function name with a `Schema` suffix
 * (`listPetsSchema`), and `file` casts generated file names the same way. Composite naming lives in
 * the `schema`, `param`, and `response` namespaces.
 */
export type ResolverZod = Resolver & {
  /**
   * Names derived from a component schema: its inferred types and the request (input) direction
   * variant, where a date-bearing component encodes `Date` back to a wire `string`.
   */
  schema: {
    /**
     * Resolves the schema type name (inferred type from schema).
     *
     * @example Schema type names
     * `resolver.schema.typeName('pet') // → 'PetSchemaType'`
     */
    typeName(name: string): string
    /**
     * Resolves the generated type name from the schema.
     *
     * @example Type names
     * `resolver.schema.type('petSchema') // → 'PetSchemaType'`
     */
    type(name: string): string
    /**
     * Resolves the schema function name for the request (input) direction of a
     * date-bearing component, where `Date` is encoded back to a wire `string`.
     *
     * @example Input schema names
     * `resolver.schema.inputName('order') // → 'orderInputSchema'`
     */
    inputName(name: string): string
    /**
     * Resolves the inferred type name for the request (input) direction variant.
     *
     * @example Input schema type names
     * `resolver.schema.inputTypeName('order') // → 'OrderInputSchemaType'`
     */
    inputTypeName(name: string): string
  }
  /**
   * Names for an operation's parameters: an individual parameter and the grouped path, query, and
   * header schemas.
   */
  param: {
    /**
     * Resolves the schema name for an individual parameter.
     *
     * @example Individual parameter name
     * `resolver.param.name(node, param) // → 'deletePetPathPetIdSchema'`
     */
    name(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped path parameters schema.
     *
     * @example Path parameters names
     * `resolver.param.path(node, param) // → 'deletePetPathPetIdSchema'`
     */
    path(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters schema.
     *
     * @example Query parameters names
     * `resolver.param.query(node, param) // → 'findPetsByStatusQueryStatusSchema'`
     */
    query(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters schema.
     *
     * @example Header parameters names
     * `resolver.param.headers(node, param) // → 'deletePetHeaderApiKeySchema'`
     */
    headers(node: ast.OperationNode, param: ast.ParameterNode): string
  }
  /**
   * Names for an operation's responses: per-status schemas, the request body, and the combined,
   * union, and error names.
   */
  response: {
    /**
     * Resolves the name for an operation response by status code.
     *
     * @example Response status names
     * `resolver.response.status(node, 200) // → 'listPetsStatus200Schema'`
     */
    status(node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the request body schema name.
     *
     * @example Request body names
     * `resolver.response.body(node) // → 'createPetBodySchema'`
     */
    body(node: ast.OperationNode): string
    /**
     * Resolves the name for the collection of all operation responses.
     *
     * @example Responses collection names
     * `resolver.response.responses(node) // → 'listPetsResponsesSchema'`
     */
    responses(node: ast.OperationNode): string
    /**
     * Resolves the name for the union of all operation responses.
     *
     * @example Response union names
     * `resolver.response.response(node) // → 'listPetsResponseSchema'`
     */
    response(node: ast.OperationNode): string
    /**
     * Resolves the name for the union of an operation's error (non-2xx) responses. Generated clients
     * validate the error body against this on the non-throw path.
     *
     * @example Error union names
     * `resolver.response.error(node) // → 'listPetsErrorSchema'`
     */
    error(node: ast.OperationNode): string
  }
}

/**
 * Where the generated Zod schemas are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'zod', barrel: { type: 'named' } }
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
   * Module specifier used in the `import { z } from '...'` statement.
   * Use `'zod/mini'` for the tree-shakeable bundle.
   *
   * @default mini ? 'zod/mini' : 'zod'
   */
  importPath?: 'zod' | 'zod/mini' | (string & {})
  /**
   * Export a `z.infer<typeof schema>` type alias next to every generated schema.
   * Lets the Zod schema act as the single source of truth.
   */
  inferred?: boolean
  /**
   * Wrap schemas in `z.coerce` so input is coerced before validation. Useful for
   * form data and query params where everything arrives as a string.
   * - `true` coerces strings, numbers, and dates.
   * - Object form picks per-primitive coercion.
   *
   * `dates` applies to fields typed as `Date` (adapter `dateType: 'date'`): they
   * validate with `z.coerce.date()` instead of the string-to-Date codec. Fields
   * kept as ISO strings (`z.iso.date()`, `z.iso.datetime()`) are never coerced.
   *
   * @default false
   * @see https://zod.dev/?id=coercion-for-primitives
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  /**
   * Validator for `format: uuid` properties.
   * - `'uuid'`: `z.uuid()`. Standard RFC 4122.
   * - `'guid'`: `z.guid()`. Accepts Microsoft-style GUIDs.
   *
   * @default 'uuid'
   */
  guidType?: 'uuid' | 'guid'
  /**
   * Output form for an OpenAPI `pattern` inside `.regex(...)`.
   * - `'literal'`: a regex literal, `.regex(/^[a-z]+$/)`.
   * - `'constructor'`: the `RegExp` constructor, `.regex(new RegExp("^[a-z]+$"))`.
   *
   * @default 'literal'
   */
  regexType?: 'literal' | 'constructor'
  /**
   * Switch to Zod Mini's functional API for better tree-shaking. Also defaults
   * `importPath` to `'zod/mini'`.
   *
   * @default false
   * @beta
   */
  mini?: boolean
  /**
   * Override how schema and operation names are built. Methods you omit fall back
   * to the default `resolverZod`.
   */
  resolver?: ResolverOverride<ResolverZod> & ThisType<ResolverZod>
  /**
   * Replace the Zod handler for a specific schema type (`'integer'`, `'date'`, ...).
   * When `mini: true`, overrides target the Zod Mini printer instead.
   */
  printer?: {
    nodes?: PrinterZodNodes | PrinterZodMiniNodes
  }
  /**
   * Macros applied to each schema or operation node before printing.
   */
  macros?: Array<ast.Macro>
}

export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  inferred: NonNullable<Options['inferred']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  guidType: NonNullable<Options['guidType']>
  regexType: NonNullable<Options['regexType']>
  mini: NonNullable<Options['mini']>
  printer: Options['printer']
}

export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, ResolverZod>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-zod': PluginZod
    }
  }
}
