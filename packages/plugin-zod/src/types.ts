import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { PrinterZodNodes } from './printers/printerZod.ts'
import type { PrinterZodMiniNodes } from './printers/printerZodMini.ts'

/**
 * Resolver for Zod that provides naming methods for schema types.
 */
export type ResolverZod = Resolver &
  ast.OperationParamsResolver & {
    /**
     * Resolves a camelCase schema function name with a `Schema` suffix.
     */
    resolveSchemaName(this: ResolverZod, name: string): string
    /**
     * Resolves the schema type name (inferred type from schema).
     *
     * @example Schema type names
     * `resolver.resolveSchemaTypeName('pet') // → 'Pet'`
     */
    resolveSchemaTypeName(this: ResolverZod, name: string): string
    /**
     * Resolves the generated type name from the schema.
     *
     * @example Type names
     * `resolver.resolveTypeName('pet') // → 'Pet'`
     */
    resolveTypeName(this: ResolverZod, name: string): string
    /**
     * Resolves the output file name for a schema.
     */
    resolvePathName(this: ResolverZod, name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the name for an operation response by status code.
     *
     * @example Response status names
     * `resolver.resolveResponseStatusName(node, 200) // → 'listPetsStatus200Schema'`
     */
    resolveResponseStatusName(this: ResolverZod, node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the name for the collection of all operation responses.
     *
     * @example Responses collection names
     * `resolver.resolveResponsesName(node) // → 'listPetsResponsesSchema'`
     */
    resolveResponsesName(this: ResolverZod, node: ast.OperationNode): string
    /**
     * Resolves the name for the union of all operation responses.
     *
     * @example Response union names
     * `resolver.resolveResponseName(node) // → 'listPetsResponseSchema'`
     */
    resolveResponseName(this: ResolverZod, node: ast.OperationNode): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example Path parameters names
     * `resolver.resolvePathParamsName(node, param) // → 'deletePetPathPetIdSchema'`
     */
    resolvePathParamsName(this: ResolverZod, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example Query parameters names
     * `resolver.resolveQueryParamsName(node, param) // → 'findPetsByStatusQueryStatusSchema'`
     */
    resolveQueryParamsName(this: ResolverZod, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example Header parameters names
     * `resolver.resolveHeaderParamsName(node, param) // → 'deletePetHeaderApiKeySchema'`
     */
    resolveHeaderParamsName(this: ResolverZod, node: ast.OperationNode, param: ast.ParameterNode): string
  }

export type Options = {
  /**
   * @default 'zod'
   */
  output?: Output
  /**
   * Group the Zod schemas based on the provided name.
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
   * Import path for Zod package.
   *
   * @default 'zod'
   */
  importPath?: 'zod' | 'zod/mini' | (string & {})
  /**
   * Add TypeScript type annotations to generated schemas.
   */
  typed?: boolean
  /**
   * Return schemas as inferred types using `z.infer`.
   */
  inferred?: boolean
  /**
   * Apply coercion to string values or configure coercion per type.
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  /**
   * Generate operation-level schemas (grouped by operationId).
   */
  operations?: boolean
  /**
   * Validator to use for UUID format: `uuid` or `guid`.
   *
   * @default 'uuid'
   */
  guidType?: 'uuid' | 'guid'
  /**
   * Use Zod Mini's functional API for better tree-shaking.
   *
   * @default false
   */
  mini?: boolean
  /**
   * Callback to wrap the generated schema output.
   *
   * Useful for adding metadata like `.openapi()` or extension helpers.
   */
  wrapOutput?: (arg: { output: string; schema: ast.SchemaNode }) => string | undefined
  /**
   * Apply casing to parameter names.
   */
  paramsCasing?: 'camelcase'
  /**
   * Additional generators alongside the default generators.
   */
  generators?: Array<Generator<PluginZod>>
  /**
   * Override naming conventions for schema names and types.
   */
  resolver?: Partial<ResolverZod> & ThisType<ResolverZod>
  /**
   * Override printer node handlers to customize rendering of specific schema types.
   */
  printer?: {
    nodes?: PrinterZodNodes | PrinterZodMiniNodes
  }
  /**
   * AST visitor to transform schema and operation nodes.
   */
  transformer?: ast.Visitor
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | undefined
  typed: NonNullable<Options['typed']>
  inferred: NonNullable<Options['inferred']>
  importPath: NonNullable<Options['importPath']>
  coercion: NonNullable<Options['coercion']>
  operations: NonNullable<Options['operations']>
  guidType: NonNullable<Options['guidType']>
  mini: NonNullable<Options['mini']>
  wrapOutput: Options['wrapOutput']
  paramsCasing: Options['paramsCasing']
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
