import type { OperationParamsResolver } from '@internals/shared'
import type { ast, DeepPartial, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'
import type { PrinterZodNodes } from './printers/printerZod.ts'
import type { PrinterZodMiniNodes } from './printers/printerZodMini.ts'

/**
 * Resolver for Zod that provides naming methods for schema types.
 */
export type ResolverZod = Resolver &
  OperationParamsResolver & {
    /**
     * Resolves a camelCase schema function name with a `Schema` suffix.
     */
    resolveSchemaName(this: ResolverZod, name: string): string
    /**
     * Resolves the schema type name (inferred type from schema).
     *
     * @example Schema type names
     * `resolver.resolveSchemaTypeName('pet') // → 'PetSchemaType'`
     */
    resolveSchemaTypeName(this: ResolverZod, name: string): string
    /**
     * Resolves the schema function name for the request (input) direction of a
     * date-bearing component, where `Date` is encoded back to a wire `string`.
     *
     * @example Input schema names
     * `resolver.resolveInputSchemaName('order') // → 'orderInputSchema'`
     */
    resolveInputSchemaName(this: ResolverZod, name: string): string
    /**
     * Resolves the inferred type name for the request (input) direction variant.
     *
     * @example Input schema type names
     * `resolver.resolveInputSchemaTypeName('order') // → 'OrderInputSchemaType'`
     */
    resolveInputSchemaTypeName(this: ResolverZod, name: string): string
    /**
     * Resolves the generated type name from the schema.
     *
     * @example Type names
     * `resolver.resolveTypeName('petSchema') // → 'PetSchemaType'`
     */
    resolveTypeName(this: ResolverZod, name: string): string
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
     * Resolves the name for the union of an operation's error (non-2xx) responses. Generated clients
     * validate the error body against this on the non-throw path.
     *
     * @example Error union names
     * `resolver.resolveErrorName(node) // → 'listPetsErrorSchema'`
     */
    resolveErrorName(this: ResolverZod, node: ast.OperationNode): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example Path parameters names
     * `resolver.resolvePathName(node, param) // → 'deletePetPathPetIdSchema'`
     */
    resolvePathName(this: ResolverZod, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example Query parameters names
     * `resolver.resolveQueryName(node, param) // → 'findPetsByStatusQueryStatusSchema'`
     */
    resolveQueryName(this: ResolverZod, node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example Header parameters names
     * `resolver.resolveHeadersName(node, param) // → 'deletePetHeaderApiKeySchema'`
     */
    resolveHeadersName(this: ResolverZod, node: ast.OperationNode, param: ast.ParameterNode): string
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
  resolver?: DeepPartial<ResolverZod> & ThisType<ResolverZod>
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
