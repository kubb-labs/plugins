import type { ast, Exclude, Generator, Group, Include, Output, Override, PluginFactoryOptions, Resolver } from '@kubb/core'
import type { PrinterTsNodes } from './printers/printerTs.ts'
/**
 * The concrete resolver type for `@kubb/plugin-ts`.
 * Extends the base `Resolver` (which provides `default` and `resolveOptions`) with
 * plugin-specific naming helpers for operations, parameters, responses, and schemas.
 */
export type ResolverTs = Resolver &
  ast.OperationParamsResolver & {
    /**
     * Resolves the name for a given raw name (equivalent to `default(name, 'function')`).
     * Since TypeScript only emits types, this is the canonical naming method.
     *
     * @example Resolving type names
     * `resolver.resolveName('list pets status 200') // → 'ListPetsStatus200'`
     */
    resolveTypeName(name: string): string
    /**
     * Resolves the file/path name for a given identifier using PascalCase.
     *
     * @example Resolving path names
     * `resolver.resolvePathName('list pets', 'file') // → 'ListPets'`
     */
    resolvePathName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
    /**
     * Resolves the request body type name for an operation (required on ResolverTs).
     */
    resolveDataName(node: ast.OperationNode): string

    /**
     * Resolves the name for an operation response by status code.
     * Encapsulates the `<operationId> Status <statusCode>` template with PascalCase applied to the result.
     *
     * @example Response status names
     * `resolver.resolveResponseStatusName(node, 200) // → 'ListPetsStatus200'`
     */
    resolveResponseStatusName(node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the name for an operation's request config (`RequestConfig`).
     *
     * @example Request config names
     * `resolver.resolveRequestConfigName(node) // → 'ListPetsRequestConfig'`
     */
    resolveRequestConfigName(node: ast.OperationNode): string
    /**
     * Resolves the name for the collection of all operation responses (`Responses`).
     *
     * @example Responses collection names
     * `resolver.resolveResponsesName(node) // → 'ListPetsResponses'`
     */
    resolveResponsesName(node: ast.OperationNode): string
    /**
     * Resolves the name for the union of all operation responses (`Response`).
     *
     * @example Response union names
     * `resolver.resolveResponseName(node) // → 'ListPetsResponse'`
     */
    resolveResponseName(node: ast.OperationNode): string
    /**
     * Resolves the TypeScript type alias name for an enum schema's key variant.
     * Appends `enumTypeSuffix` (default `'Key'`) after applying the default naming convention.
     *
     * @example Enum key names with different suffixes
     * ```ts
     * resolver.resolveEnumKeyName(node, 'Key')   // → 'PetStatusKey'
     * resolver.resolveEnumKeyName(node, 'Value') // → 'PetStatusValue'
     * resolver.resolveEnumKeyName(node, '')      // → 'PetStatus'
     * ```
     */
    resolveEnumKeyName(node: { name?: string | null }, enumTypeSuffix: string): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example Path parameters names
     * `resolver.resolvePathParamsName(node, param) // → 'GetPetByIdPathParams'`
     */
    resolvePathParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example Query parameters names
     * `resolver.resolveQueryParamsName(node, param) // → 'FindPetsByStatusQueryParams'`
     */
    resolveQueryParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example Header parameters names
     * `resolver.resolveHeaderParamsName(node, param) // → 'DeletePetHeaderParams'`
     */
    resolveHeaderParamsName(node: ast.OperationNode, param: ast.ParameterNode): string
  }

type EnumKeyCasing = 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'

/**
 * Discriminated union that ties `enumTypeSuffix` and `enumKeyCasing` to the enum types that actually use them.
 *
 * - `'asConst'` / `'asPascalConst'` — emit a `const` object; both `enumTypeSuffix` (type-alias suffix) and
 *    `enumKeyCasing` (key formatting) are meaningful.
 * - `'enum'` / `'constEnum'` — emit a TypeScript enum; `enumKeyCasing` applies to member names,
 *    but there is no separate type alias so `enumTypeSuffix` is not used.
 * - `'literal'` / `'inlineLiteral'` — emit only union literals; keys are discarded entirely,
 *    so neither `enumTypeSuffix` nor `enumKeyCasing` have any effect.
 */
type EnumTypeOptions =
  | {
      /**
       * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
       * - 'asConst' generates const objects with camelCase names and as const assertion.
       * - 'asPascalConst' generates const objects with PascalCase names and as const assertion.
       * @default 'asConst'
       */
      enumType?: 'asConst' | 'asPascalConst'
      /**
       * Suffix appended to the generated type alias name.
       *
       * Only affects the type alias — the const object name is unchanged.
       *
       * @default 'Key'
       * @example enumTypeSuffix: 'Value' → `export type PetStatusValue = …`
       */
      enumTypeSuffix?: string
      /**
       * Choose the casing for enum key names.
       * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
       * - 'snakeCase' generates keys in snake_case format.
       * - 'pascalCase' generates keys in PascalCase format.
       * - 'camelCase' generates keys in camelCase format.
       * - 'none' uses the enum value as-is without transformation.
       * @default 'none'
       */
      enumKeyCasing?: EnumKeyCasing
    }
  | {
      /**
       * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
       * - 'enum' generates TypeScript enum declarations.
       * - 'constEnum' generates TypeScript const enum declarations.
       * @default 'asConst'
       */
      enumType?: 'enum' | 'constEnum'
      /**
       * `enumTypeSuffix` has no effect for this `enumType`.
       * It is only used when `enumType` is `'asConst'` or `'asPascalConst'`.
       */
      enumTypeSuffix?: never
      /**
       * Choose the casing for enum key names.
       * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
       * - 'snakeCase' generates keys in snake_case format.
       * - 'pascalCase' generates keys in PascalCase format.
       * - 'camelCase' generates keys in camelCase format.
       * - 'none' uses the enum value as-is without transformation.
       * @default 'none'
       */
      enumKeyCasing?: EnumKeyCasing
    }
  | {
      /**
       * Choose to use enum, asConst, asPascalConst, constEnum, literal, or inlineLiteral for enums.
       * - 'literal' generates literal union types.
       * - 'inlineLiteral' will inline enum values directly into the type (default in v5).
       * @default 'asConst'
       * @note In Kubb v5, 'inlineLiteral' becomes the default.
       */
      enumType?: 'literal' | 'inlineLiteral'
      /**
       * `enumTypeSuffix` has no effect for this `enumType`.
       * It is only used when `enumType` is `'asConst'` or `'asPascalConst'`.
       */
      enumTypeSuffix?: never
      /**
       * `enumKeyCasing` has no effect for this `enumType`.
       * Literal and inlineLiteral modes emit only values — keys are discarded entirely.
       */
      enumKeyCasing?: never
    }

export type Options = {
  /**
   * Where the generated `.ts` files are written and how they are exported.
   *
   * @default { path: 'types', barrel: { type: 'named' } }
   */
  output?: Output
  /**
   * Media type read from the OpenAPI spec when an operation defines several.
   * Defaults to the first JSON-compatible media type Kubb finds.
   */
  contentType?: 'application/json' | (string & {})
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
   * Whether object schemas are emitted as `type` aliases or `interface` declarations.
   * - `'type'` emits closed type aliases. Safer default for generated code.
   * - `'interface'` emits interfaces. Useful when consumers rely on declaration merging.
   *
   * @default 'type'
   * @see https://www.totaltypescript.com/type-vs-interface-which-should-you-use
   */
  syntaxType?: 'type' | 'interface'
  /**
   * How optional properties are written in generated types.
   * - `'questionToken'` — `type?: string`. The property may be missing.
   * - `'undefined'` — `type: string | undefined`. Required to exist, may be `undefined`.
   * - `'questionTokenAndUndefined'` — `type?: string | undefined`. Strictest.
   *
   * @default 'questionToken'
   * @note Pick `'questionTokenAndUndefined'` when `exactOptionalPropertyTypes` is on in `tsconfig.json`.
   */
  optionalType?: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  /**
   * Syntax used for array types.
   * - `'array'` — `Type[]`. Shorter.
   * - `'generic'` — `Array<Type>`. More readable for complex element types.
   *
   * @default 'array'
   */
  arrayType?: 'generic' | 'array'
  /**
   * Rename properties inside `PathParams`, `QueryParams`, and `HeaderParams` types.
   * Response and request body types are not affected.
   *
   * @note Every plugin that touches operation parameters must use the same value.
   */
  paramsCasing?: 'camelcase'
  /**
   * Custom generators that run alongside the built-in TypeScript generators.
   */
  generators?: Array<Generator<PluginTs>>
  /**
   * Override how names and file paths are built for generated symbols.
   * Methods you omit fall back to the default `resolverTs`. `this` is bound to the
   * full resolver, so `this.default(name, 'function')` delegates to the built-in
   * implementation.
   */
  resolver?: Partial<ResolverTs> & ThisType<ResolverTs>
  /**
   * AST visitor applied to each schema or operation node before printing.
   * Methods you omit fall back to the preset transformer.
   *
   * @example Drop writeOnly properties from response types
   * ```ts
   * transformer: {
   *   property(node) {
   *     if (node.schema.writeOnly) return undefined
   *   }
   * }
   * ```
   */
  transformer?: ast.Visitor
  /**
   * Replace the TypeScript handler for a specific schema type (`'integer'`, `'date'`, ...).
   * Each handler returns a TypeScript AST node for that schema type. Use `this.transform`
   * to recurse into nested schema nodes.
   *
   * @example Use the JavaScript `Date` object for date schemas
   * ```ts
   * import ts from 'typescript'
   * pluginTs({
   *   printer: {
   *     nodes: {
   *       date() {
   *         return ts.factory.createTypeReferenceNode('Date', [])
   *       },
   *     },
   *   },
   * })
   * ```
   */
  printer?: {
    nodes?: PrinterTsNodes
  }
} & EnumTypeOptions

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  enumType: NonNullable<Options['enumType']>
  enumTypeSuffix: NonNullable<Options['enumTypeSuffix']>
  enumKeyCasing: EnumKeyCasing
  optionalType: NonNullable<Options['optionalType']>
  arrayType: NonNullable<Options['arrayType']>
  syntaxType: NonNullable<Options['syntaxType']>
  paramsCasing: Options['paramsCasing']
  printer: Options['printer']
}

export type PluginTs = PluginFactoryOptions<'plugin-ts', Options, ResolvedOptions, ResolverTs>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-ts': PluginTs
    }
  }
}
