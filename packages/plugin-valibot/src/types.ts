import type { ast } from '@internals/ast'
import type { ResolvedPluginOptions } from '@internals/shared/types'
import type { Exclude, Include, OutputOptions, Override, PluginType, Resolver, ResolverInput } from '@kubb/kit'
import type { PrinterValibotFactory, PrinterValibotNodes } from './printers/printerValibot.ts'

/**
 * The names the plugin gives to generated schemas and their inferred types.
 */
export type ResolverValibot = Resolver & {
  schema: {
    /**
     * The inferred type name of a component schema.
     *
     * @example
     * ```ts
     * resolver.schema.typeName('pet') // 'PetSchemaType'
     * ```
     */
    typeName(name: string): string
    /**
     * The inferred type name of an operation schema, which already ends in `Schema`.
     *
     * @example
     * ```ts
     * resolver.schema.type('addPetBodySchema') // 'AddPetBodySchemaType'
     * ```
     */
    type(name: string): string
    /**
     * The name of the request variant of a component schema, which encodes where the schema decodes.
     *
     * @example
     * ```ts
     * resolver.schema.inputName('pet') // 'petInputSchema'
     * ```
     */
    inputName(name: string): string
    /**
     * The inferred type name of the request variant.
     */
    inputTypeName(name: string): string
    /**
     * The name of the type guard of a component schema.
     *
     * @example
     * ```ts
     * resolver.schema.isName('pet') // 'isPet'
     * ```
     */
    isName(name: string): string
    /**
     * The name of the assertion function of a component schema.
     *
     * @example
     * ```ts
     * resolver.schema.assertName('pet') // 'assertPet'
     * ```
     */
    assertName(name: string): string
  }
  param: {
    name(node: ast.OperationNode, param: ast.ParameterNode): string
    path(node: ast.OperationNode, param: ast.ParameterNode): string
    query(node: ast.OperationNode, param: ast.ParameterNode): string
    headers(node: ast.OperationNode, param: ast.ParameterNode): string
    cookies(node: ast.OperationNode, param: ast.ParameterNode): string
  }
  response: {
    status(node: ast.OperationNode, statusCode: ast.StatusCode): string
    headers(node: ast.OperationNode, statusCode: ast.StatusCode): string
    body(node: ast.OperationNode): string
    /**
     * Name of the per-status record of an operation's responses. Generated only with `inferred: true`.
     */
    responses(node: ast.OperationNode): string
    response(node: ast.OperationNode): string
    error(node: ast.OperationNode): string
    /**
     * Inferred type name of an operation's combined `{ body, path, query, headers }` object.
     * Generated only with `inferred: true`.
     */
    options(node: ast.OperationNode): string
  }
}

export type PluginValibotOptions = OutputOptions & {
  /**
   * Skip any operation, tag, path, or schema that matches one of these patterns.
   */
  exclude?: Array<Exclude>
  /**
   * Generate only the operations, tags, paths, or schemas that match one of these patterns.
   */
  include?: Array<Include>
  /**
   * Apply different plugin options to the operations or schemas that match a pattern.
   */
  override?: Array<Override<PluginValibotResolvedOptions>>
  /**
   * Module specifier the generated files import `v` from.
   *
   * @default 'valibot'
   */
  importPath?: string
  /**
   * Export a type alias next to every schema: `v.InferInput` for a request schema, which is the
   * value the caller passes, and `v.InferOutput` for every other schema.
   */
  inferred?: boolean
  /**
   * Convert input before validation with `v.toString()`, `v.toNumber()`, and `v.toDate()`.
   * Pass an object to turn it on per type.
   *
   * @default false
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  /**
   * Generate an `is*` type guard and an `assert*` function for every component schema.
   *
   * @default false
   */
  typeGuards?: boolean | { is?: boolean; assert?: boolean }
  /**
   * Output form for an OpenAPI `pattern` inside `v.regex(...)`: a regex literal (`'literal'`) or
   * the `RegExp` constructor (`'constructor'`).
   *
   * @default 'literal'
   */
  regexType?: 'literal' | 'constructor'
  /**
   * How a `oneOf` is validated, unless it prints as `v.variant(...)`.
   * - `'union'`: `v.union([...])` with strict object members, which also rejects extra keys the spec allows.
   * - `'xor'`: `v.union([...])` behind a check that passes only when exactly one member matches.
   *
   * @default 'union'
   */
  oneOfType?: 'union' | 'xor'
  /**
   * Override the names the plugin gives to schemas, types, and files.
   */
  resolver?: ResolverInput<ResolverValibot>
  /**
   * Replace the printed output of a schema node type.
   *
   * @example
   * ```ts
   * pluginValibot({
   *   printer: {
   *     nodes: {
   *       date() {
   *         return 'v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value)))'
   *       },
   *     },
   *   },
   * })
   * ```
   */
  printer?: {
    nodes?: PrinterValibotNodes
  }
  /**
   * AST macros applied to each schema or operation node before it is printed.
   */
  macros?: Array<ast.Macro>
}

export type PluginValibotResolvedOptions = ResolvedPluginOptions<PluginValibotResolvedOptions> & {
  importPath: NonNullable<PluginValibotOptions['importPath']>
  inferred: NonNullable<PluginValibotOptions['inferred']>
  regexType: NonNullable<PluginValibotOptions['regexType']>
  oneOfType: NonNullable<PluginValibotOptions['oneOfType']>
  coercion: NonNullable<PluginValibotOptions['coercion']>
  typeGuards: NonNullable<PluginValibotOptions['typeGuards']>
  printer: PluginValibotOptions['printer']
}

export type PluginValibot = PluginType<
  'plugin-valibot',
  PluginValibotOptions,
  PluginValibotResolvedOptions,
  ResolverValibot,
  ast.Printer<PrinterValibotFactory>
>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-valibot': PluginValibot
    }
    interface MemoRegistry {
      'plugin-valibot:typeName': string
      'plugin-valibot:type': string
    }
  }
}
