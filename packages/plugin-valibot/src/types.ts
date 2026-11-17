import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginType, Resolver, ResolverPatch } from '@kubb/kit'
import type { PrinterValibotNodes, printerValibot } from './printers/printerValibot.ts'

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
    response(node: ast.OperationNode): string
    error(node: ast.OperationNode): string
  }
}

export type Options = OutputOptions & {
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
  override?: Array<Override<ResolvedOptions>>
  /**
   * Module specifier the generated files import `v` from.
   *
   * @default 'valibot'
   */
  importPath?: string
  /**
   * Export a `v.InferOutput` type alias next to every schema.
   */
  inferred?: boolean
  /**
   * Output form for an OpenAPI `pattern` inside `v.regex(...)`: a regex literal (`'literal'`) or
   * the `RegExp` constructor (`'constructor'`).
   *
   * @default 'literal'
   */
  regexType?: 'literal' | 'constructor'
  /**
   * Override the names the plugin gives to schemas, types, and files.
   */
  resolver?: ResolverPatch<ResolverValibot>
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

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  importPath: NonNullable<Options['importPath']>
  inferred: NonNullable<Options['inferred']>
  regexType: NonNullable<Options['regexType']>
  printer: Options['printer']
}

export type PluginValibot = PluginType<'plugin-valibot', Options, ResolvedOptions, ResolverValibot>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-valibot': PluginValibot
    }
    interface MemoRegistry {
      valibotPrinter: ReturnType<typeof printerValibot>
    }
  }
}
