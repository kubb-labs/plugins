import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver, ResolverPatch } from 'kubb/kit'
import type { PrinterEffectNodes } from './printers/printerEffect.ts'

/**
 * Resolver for Effect schema, parameter, and response names.
 */
export type ResolverEffect = Resolver & {
  /**
   * Names for operation parameters.
   */
  param: {
    /**
     * Resolves an individual parameter name.
     */
    name(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves a path parameter name.
     */
    path(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves a query parameter name.
     */
    query(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves a header parameter name.
     */
    headers(node: ast.OperationNode, param: ast.ParameterNode): string
  }
  /**
   * Names for operation responses and request bodies.
   */
  response: {
    /**
     * Resolves a response name for a status code.
     */
    status(node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves a request body name.
     */
    body(node: ast.OperationNode): string
    /**
     * Resolves the response collection name.
     */
    responses(node: ast.OperationNode): string
    /**
     * Resolves the successful response union name.
     */
    response(node: ast.OperationNode): string
    /**
     * Resolves the error response union name.
     */
    error(node: ast.OperationNode): string
  }
}

/**
 * Options for generating Effect v4 schemas.
 */
export type Options = OutputOptions & {
  /**
   * Skips operations matching at least one entry.
   */
  exclude?: Array<Exclude>
  /**
   * Restricts generation to matching operations.
   */
  include?: Array<Include>
  /**
   * Applies different options to matching operations.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Module specifier for the Effect Schema namespace import.
   *
   * @default 'effect/Schema'
   */
  importPath?: 'effect/Schema' | (string & {})
  /**
   * Output form for OpenAPI regular expressions.
   *
   * @default 'constructor'
   */
  regexType?: 'literal' | 'constructor'
  /**
   * Overrides generated schema and operation names.
   */
  resolver?: ResolverPatch<ResolverEffect>
  /**
   * Replaces handlers for individual schema node types.
   */
  printer?: {
    /**
     * Custom node handlers.
     */
    nodes?: PrinterEffectNodes
  }
  /**
   * Macros applied before printing each node.
   */
  macros?: Array<ast.Macro>
}

/**
 * Fully resolved options supplied to the Effect generator.
 */
export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  importPath: NonNullable<Options['importPath']>
  regexType: NonNullable<Options['regexType']>
  printer: Options['printer']
}

/**
 * Kubb registry entry for `@kubb/plugin-effect`.
 */
export type PluginEffect = PluginFactoryOptions<'plugin-effect', Options, ResolvedOptions, ResolverEffect>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-effect': PluginEffect
    }
  }
}
