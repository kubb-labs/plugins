import type { ast, ResolverOverride, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'
import type { PrinterTsNodes } from './printers/printerTs.ts'
/**
 * The concrete resolver type for `@kubb/plugin-ts`.
 * Extends the base `Resolver` (which provides `default` naming and option helpers, the top-level
 * `name` casing, and the `file` builder) with plugin-specific naming namespaces for operation
 * parameters, responses, and enum schemas.
 */
export type ResolverTs = Resolver & {
  /**
   * Naming for an operation's parameters, grouped by location.
   */
  param: {
    /**
     * Resolves the type name for an individual parameter.
     *
     * @example Individual parameter name
     * `resolver.param.name(node, param) // → 'DeletePetPathPetId'`
     */
    name(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped path parameters type.
     *
     * @example Path parameters names
     * `resolver.param.path(node, param) // → 'GetPetByIdPath'`
     */
    path(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped query parameters type.
     *
     * @example Query parameters names
     * `resolver.param.query(node, param) // → 'FindPetsByStatusQuery'`
     */
    query(node: ast.OperationNode, param: ast.ParameterNode): string
    /**
     * Resolves the name for an operation's grouped header parameters type.
     *
     * @example Header parameters names
     * `resolver.param.headers(node, param) // → 'DeletePetHeaders'`
     */
    headers(node: ast.OperationNode, param: ast.ParameterNode): string
  }
  /**
   * Naming for an operation's request and response types.
   */
  response: {
    /**
     * Resolves the name for an operation response by status code.
     * Encapsulates the `<operationId> Status <statusCode>` template with PascalCase applied to the result.
     *
     * @example Response status names
     * `resolver.response.status(node, 200) // → 'ListPetsStatus200'`
     */
    status(node: ast.OperationNode, statusCode: ast.StatusCode): string
    /**
     * Resolves the name for an operation's request config (`RequestConfig`).
     *
     * The `RequestConfig` suffix is kept through the v5 beta to avoid churn, but it overlaps with the
     * runtime client's `RequestConfig`. Renaming to `Request` is on the table before stable.
     *
     * @example Request config names
     * `resolver.response.config(node) // → 'ListPetsRequestConfig'`
     */
    config(node: ast.OperationNode): string
    /**
     * Resolves the name for the collection of all operation responses (`Responses`).
     *
     * @example Responses collection names
     * `resolver.response.responses(node) // → 'ListPetsResponses'`
     */
    responses(node: ast.OperationNode): string
    /**
     * Resolves the name for the union of all operation responses (`Response`).
     *
     * @example Response union names
     * `resolver.response.response(node) // → 'ListPetsResponse'`
     */
    response(node: ast.OperationNode): string
    /**
     * Resolves the request body type name.
     *
     * @example Request body type name
     * `resolver.response.body(node) // → 'CreatePetBody'`
     */
    body(node: ast.OperationNode): string
  }
  /**
   * Naming for enum schemas.
   */
  enum: {
    /**
     * Resolves the TypeScript type alias name for an enum schema's key variant.
     * Appends `enumTypeSuffix` (default `'key'`) after applying the default naming convention.
     *
     * @example Enum key names with different suffixes
     * ```ts
     * resolver.enum.keyName(node, 'Key')   // → 'PetStatusKey'
     * resolver.enum.keyName(node, 'Value') // → 'PetStatusValue'
     * resolver.enum.keyName(node, '')      // → 'PetStatus'
     * ```
     */
    keyName(node: { name?: string | null }, enumTypeSuffix?: string): string
  }
}

type EnumKeyCasing = 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'

type EnumConstCasing = 'camelCase' | 'pascalCase'

/**
 * Grouped enum settings. Each `type` uses only some of the other fields.
 *
 * - `'asConst'` emits a `const` object plus a `typeof` type alias, so `constCasing`, `typeSuffix`, and `keyCasing` all apply.
 * - `'enum'` and `'constEnum'` emit a TypeScript enum, so only `keyCasing` (the member names) applies.
 * - `'literal'` and `'inlineLiteral'` emit union literals and drop the keys, so none of the other fields apply.
 *
 * @example Share one name between the const and the type
 * ```ts
 * enum: { type: 'asConst', constCasing: 'pascalCase', typeSuffix: '' }
 * // export const VehicleType = { … } as const
 * // export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType]
 * ```
 */
type EnumOptions =
  | {
      /**
       * Emit a `const` object asserted with `as const`, paired with a `typeof` type alias.
       * This is tree-shakeable and adds no enum runtime.
       *
       * @default 'asConst'
       */
      type?: 'asConst'
      /**
       * Casing of the generated const variable.
       * - 'camelCase' names the const `vehicleType`.
       * - 'pascalCase' names the const `VehicleType`, matching the schema name.
       *
       * @default 'camelCase'
       */
      constCasing?: EnumConstCasing
      /**
       * Suffix appended to the generated type alias name. Only the type alias is renamed. The const
       * object name stays the same. Set it to `''` together with `constCasing: 'pascalCase'` to merge
       * the const and type under the schema's exact name.
       *
       * @default 'Key'
       * @example A custom suffix
       * `typeSuffix: 'Value'` renames the alias to `PetStatusValue`
       */
      typeSuffix?: string
      /**
       * Choose the casing for enum key names.
       * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
       * - 'snakeCase' generates keys in snake_case format.
       * - 'pascalCase' generates keys in PascalCase format.
       * - 'camelCase' generates keys in camelCase format.
       * - 'none' uses the enum value as-is without transformation.
       * @default 'none'
       */
      keyCasing?: EnumKeyCasing
    }
  | {
      /**
       * Emit a TypeScript `enum` (`'enum'`) or `const enum` (`'constEnum'`) declaration.
       *
       * @default 'asConst'
       */
      type?: 'enum' | 'constEnum'
      /**
       * `constCasing` has no effect for this `type`. Only `'asConst'` emits a const object.
       */
      constCasing?: never
      /**
       * `typeSuffix` has no effect for this `type`. Only `'asConst'` emits a separate type alias.
       */
      typeSuffix?: never
      /**
       * Choose the casing for enum member names.
       * - 'screamingSnakeCase' generates keys in SCREAMING_SNAKE_CASE format.
       * - 'snakeCase' generates keys in snake_case format.
       * - 'pascalCase' generates keys in PascalCase format.
       * - 'camelCase' generates keys in camelCase format.
       * - 'none' uses the enum value as-is without transformation.
       * @default 'none'
       */
      keyCasing?: EnumKeyCasing
    }
  | {
      /**
       * Emit a union of literals as a named alias (`'literal'`) or inline the union at every usage
       * site (`'inlineLiteral'`).
       *
       * @default 'asConst'
       * @note In Kubb v5, 'inlineLiteral' becomes the default.
       */
      type?: 'literal' | 'inlineLiteral'
      /**
       * `constCasing` has no effect for this `type`; literal modes emit no const object.
       */
      constCasing?: never
      /**
       * `typeSuffix` has no effect for this `type`; literal modes emit no separate type alias.
       */
      typeSuffix?: never
      /**
       * `keyCasing` has no effect for this `type`. Literal and inlineLiteral modes emit only values,
       * so the keys are discarded.
       */
      keyCasing?: never
    }

/**
 * Where the generated `.ts` files are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'types', barrel: { type: 'named' } }
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
   * Override how names and file paths are built for generated symbols.
   * Methods you omit fall back to the default `resolverTs`. `this` is bound to the
   * full resolver, so `this.default.name(name)` delegates to the built-in implementation.
   */
  resolver?: ResolverOverride<ResolverTs> & ThisType<ResolverTs>
  /**
   * Macros applied to each schema or operation node before printing.
   * Callbacks you omit fall back to the preset behavior.
   *
   * @example Drop writeOnly properties from response types
   * ```ts
   * macros: [
   *   {
   *     name: 'drop-write-only',
   *     property(node) {
   *       if (node.schema.writeOnly) return undefined
   *     },
   *   },
   * ]
   * ```
   */
  macros?: Array<ast.Macro>
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
  /**
   * How OpenAPI enums are represented in the generated TypeScript, and how their names are cased.
   */
  enum?: EnumOptions
}

export type ResolvedEnumOptions = {
  type: NonNullable<EnumOptions['type']>
  constCasing: EnumConstCasing
  typeSuffix: string
  keyCasing: EnumKeyCasing
}

export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  enum: ResolvedEnumOptions
  optionalType: NonNullable<Options['optionalType']>
  arrayType: NonNullable<Options['arrayType']>
  syntaxType: NonNullable<Options['syntaxType']>
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
