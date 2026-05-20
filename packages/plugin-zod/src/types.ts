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
   * Where the generated Zod schemas are written and how they are exported.
   *
   * @default { path: 'zod', barrel: { type: 'named' } }
   */
  output?: Output
  /**
   * Split generated files into subfolders based on the operation's tag.
   */
  group?: Group
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
   * @default 'zod'
   */
  importPath?: 'zod' | 'zod/mini' | (string & {})
  /**
   * Tie each Zod schema to its TypeScript type from `@kubb/plugin-ts`. Requires
   * `@kubb/plugin-ts` in the plugins list. TypeScript fails compilation when the
   * schema drifts from the type.
   */
  typed?: boolean
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
   * @default false
   * @see https://zod.dev/?id=coercion-for-primitives
   */
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
  /**
   * Emit an `operations.ts` file with request body, query/path params, and per-status
   * response schemas grouped by operation.
   */
  operations?: boolean
  /**
   * Validator for `format: uuid` properties.
   * - `'uuid'` — `z.uuid()`. Standard RFC 4122.
   * - `'guid'` — `z.guid()`. Accepts Microsoft-style GUIDs.
   *
   * @default 'uuid'
   */
  guidType?: 'uuid' | 'guid'
  /**
   * Switch to Zod Mini's functional API for better tree-shaking. Also defaults
   * `importPath` to `'zod/mini'`.
   *
   * @default false
   * @beta
   */
  mini?: boolean
  /**
   * Wrap the generated Zod schema string with extra calls. Receives the raw output
   * and the originating `SchemaNode`. Useful for round-tripping OpenAPI metadata
   * back into Zod (e.g. `.openapi(...)`).
   */
  wrapOutput?: (arg: { output: string; schema: ast.SchemaNode }) => string | undefined
  /**
   * Rename properties inside path/query/header schemas. Body schemas are unaffected.
   *
   * @note Must match the value of `paramsCasing` on `@kubb/plugin-ts`.
   */
  paramsCasing?: 'camelcase'
  /**
   * Custom generators that run alongside the built-in Zod generators.
   */
  generators?: Array<Generator<PluginZod>>
  /**
   * Override how schema and operation names are built. Methods you omit fall back
   * to the default `resolverZod`.
   */
  resolver?: Partial<ResolverZod> & ThisType<ResolverZod>
  /**
   * Replace the Zod handler for a specific schema type (`'integer'`, `'date'`, ...).
   * When `mini: true`, overrides target the Zod Mini printer instead.
   */
  printer?: {
    nodes?: PrinterZodNodes | PrinterZodMiniNodes
  }
  /**
   * AST visitor applied to each schema or operation node before printing.
   */
  transformer?: ast.Visitor
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
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
