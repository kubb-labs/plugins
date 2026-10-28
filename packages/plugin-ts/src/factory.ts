import { screamingSnakeCase, snakeCase } from '@internals/utils'
import { syncSchemaRef } from 'kubb/kit'
import type { Resolver } from 'kubb/kit'
import type { ast } from 'kubb/kit'
import { generate } from 'yuku-codegen'

/**
 * A TS-ESTree node, the AST shape `yuku-codegen` prints. Nodes built here carry no source positions.
 */
export type TsNode = { type: string; [key: string]: unknown }

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

export function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Prints `node` as TypeScript source with single quotes and two-space indentation.
 */
export function print(node: TsNode): string {
  return generate(node as unknown as Parameters<typeof generate>[0], { quotes: 'single' }).code
}

/**
 * Wraps already printed TypeScript, such as a user override result, so it can sit inside a node tree.
 * Parentheses keep a union or function type intact when it lands inside an array or intersection.
 */
export function createRaw(text: string): TsNode {
  const name = { type: 'TSTypeReference', typeName: identifier(text), typeArguments: null }
  return /[|&?]|=>/.test(text) ? { type: 'TSParenthesizedType', typeAnnotation: name } : name
}

function identifier(name: string): TsNode {
  return { type: 'Identifier', name }
}

function literal(value: string | number | boolean): TsNode {
  return { type: 'Literal', value }
}

function createLiteralType(value: string | number | boolean): TsNode {
  return { type: 'TSLiteralType', literal: literal(value) }
}

/**
 * Whether `name` can be written as a bare property name instead of a quoted string.
 */
function isValidIdentifier(name: string): boolean {
  return /^[\p{ID_Start}$_][\p{ID_Continue}$‌‍]*$/u.test(name)
}

/**
 * A property or enum member name, quoted when it is not a valid identifier.
 */
function propertyName(name: string): TsNode {
  return isValidIdentifier(name) ? identifier(name) : literal(name)
}

/**
 * Indents every non-empty line of `text` by two spaces.
 */
function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n')
}

/**
 * Creates a TypeScript intersection type.
 * Returns the single type if only one is provided. `yuku-codegen` adds the parentheses a union member needs.
 */
export function createIntersectionDeclaration({ nodes, withParentheses }: { nodes: Array<TsNode>; withParentheses?: boolean }): TsNode | null {
  if (!nodes.length) {
    return null
  }

  if (nodes.length === 1) {
    return nodes[0] || null
  }

  const node = { type: 'TSIntersectionType', types: nodes }

  return withParentheses ? { type: 'TSParenthesizedType', typeAnnotation: node } : node
}

/**
 * Creates a TypeScript array type.
 * Use `arrayType: 'array'` for bracket syntax (`T[]`), or `'generic'` for `Array<T>`.
 *
 * @example Array bracket syntax
 * `createArrayDeclaration({ nodes: [string], arrayType: 'array' }) // → string[]`
 *
 * @example Generic Array syntax
 * `createArrayDeclaration({ nodes: [string], arrayType: 'generic' }) // → Array<string>`
 */
export function createArrayDeclaration({ nodes, arrayType = 'array' }: { nodes: Array<TsNode>; arrayType?: 'array' | 'generic' }): TsNode {
  if (!nodes.length) {
    return { type: 'TSTupleType', elementTypes: [] }
  }

  const node = nodes.length === 1 ? nodes[0]! : { type: 'TSUnionType', types: nodes }

  return arrayType === 'generic' ? createTypeReferenceNode('Array', [node]) : { type: 'TSArrayType', elementType: node }
}

/**
 * Minimum nodes length of 2
 * @example Union type example
 * `string | number`
 */
export function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<TsNode>; withParentheses?: boolean }): TsNode {
  if (!nodes.length) {
    return keywordTypeNodes.any
  }

  if (nodes.length === 1) {
    return nodes[0]!
  }

  const node = { type: 'TSUnionType', types: nodes }

  return withParentheses ? { type: 'TSParenthesizedType', typeAnnotation: node } : node
}

/**
 * Creates a TypeScript property signature for object/interface members.
 * Supports optional markers, readonly modifiers, and type annotations.
 */
export function createPropertySignature({
  readOnly,
  name,
  questionToken,
  type,
}: {
  readOnly?: boolean
  name: string
  questionToken?: boolean
  type?: TsNode
}): TsNode {
  return {
    type: 'TSPropertySignature',
    key: propertyName(name),
    computed: false,
    optional: !!questionToken,
    readonly: !!readOnly,
    static: false,
    typeAnnotation: type ? { type: 'TSTypeAnnotation', typeAnnotation: type } : null,
  }
}

/**
 * Attaches a JSDoc block built from `comments` to `node`, dropping empty comments.
 */
export function appendJSDocToNode<TNode extends TsNode>({ node, comments }: { node: TNode; comments: Array<string | undefined> }): TNode {
  const lines = comments.filter(Boolean).flatMap((comment = '') => comment.split(/\r?\n/))

  if (!lines.length) {
    return node
  }

  // `yuku-codegen` prints the comment text as is, so a `*/` inside it would end the block early
  const value = `*\n${lines.map((line) => ` * ${line.replaceAll('*/', '*\\/')}`.trimEnd()).join('\n')}\n `

  return { ...node, comments: [{ type: 'Block', value, position: 'before', sameLine: false }] }
}

/**
 * Creates a TypeScript type literal (anonymous object type) with one member per line.
 */
export function createTypeLiteralNode(members: Array<TsNode>): TsNode {
  return { type: 'TSTypeLiteral', members }
}

/**
 * Creates a TypeScript type reference (e.g., `Array<string>`, `Record<K, V>`).
 */
export function createTypeReferenceNode(name: string, typeArguments?: Array<TsNode>): TsNode {
  return {
    type: 'TSTypeReference',
    typeName: identifier(name),
    typeArguments: typeArguments?.length ? { type: 'TSTypeParameterInstantiation', params: typeArguments } : null,
  }
}

function exportNamed(declaration: TsNode, exportKind: 'type' | 'value'): TsNode {
  return { type: 'ExportNamedDeclaration', declaration, specifiers: [], source: null, attributes: [], exportKind }
}

/**
 * Prints a TypeScript type declaration as either a type alias or interface.
 * Uses interface syntax only when requested and the type is an object literal, and attaches JSDoc comments.
 */
export function createTypeDeclaration({
  syntax,
  isExportable,
  comments,
  name,
  type,
}: {
  syntax: 'type' | 'interface'
  comments: Array<string | undefined>
  isExportable?: boolean
  name: string
  type: TsNode
}): string {
  const declaration =
    syntax === 'interface' && type.type === 'TSTypeLiteral'
      ? {
          type: 'TSInterfaceDeclaration',
          declare: false,
          id: identifier(name),
          typeParameters: null,
          extends: [],
          body: { type: 'TSInterfaceBody', body: type.members },
        }
      : { type: 'TSTypeAliasDeclaration', declare: false, id: identifier(name), typeParameters: null, typeAnnotation: type }

  return print(appendJSDocToNode({ node: isExportable ? exportNamed(declaration, 'type') : declaration, comments }))
}

/**
 * Converts an enum member value to a literal. Numbers become numeric literals unless `asNumber` is `false`,
 * which emits the string form.
 */
function valueToExpression(value: string | number | boolean, asNumber = isNumber(value)): TsNode {
  return literal(typeof value === 'boolean' || (asNumber && isNumber(value)) ? value : value.toString())
}

type EnumCasing = Pick<Resolver, 'camelCase' | 'pascalCase'>

/**
 * Apply casing transformation to enum keys
 */
function applyEnumKeyCasing(key: string, casing: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none', resolver: EnumCasing): string {
  if (casing === 'none') {
    return key
  }
  if (casing === 'screamingSnakeCase') {
    return screamingSnakeCase(key)
  }
  if (casing === 'snakeCase') {
    return snakeCase(key)
  }
  if (casing === 'pascalCase') {
    return resolver.pascalCase(key)
  }
  if (casing === 'camelCase') {
    return resolver.camelCase(key)
  }
  return key
}

/**
 * Creates a TypeScript enum declaration or equivalent construct in various formats.
 * Returns a tuple of [name declaration, type declaration] - the name declaration may be undefined for certain types.
 *
 * @example
 * ```ts
 * const [name, type] = createEnumDeclaration({
 *   type: 'enum',
 *   name: 'petType',
 *   typeName: 'PetType',
 *   enums: [['cat', 'cat', 'A cat'], ['dog', 'dog']],
 * })
 * ```
 */
export function createEnumDeclaration({
  type = 'enum',
  name,
  typeName,
  enums,
  enumKeyCasing = 'none',
  resolver,
}: {
  /**
   * Choose to use `enum`, `asConst`, `constEnum`, or `literal` for enums.
   * - `enum`: TypeScript enum
   * - `asConst`: const object asserted with `as const` (the caller decides the const name casing)
   * - `constEnum`: const enum
   * - `literal`: literal union type
   * @default `'enum'`
   */
  type?: 'enum' | 'asConst' | 'constEnum' | 'literal' | 'inlineLiteral'
  /**
   * Enum name in camelCase.
   */
  name: string
  /**
   * Enum name in PascalCase.
   */
  typeName: string
  enums: Array<[key: string | number, value: string | number | boolean, description?: string]>
  /**
   * Choose the casing for enum key names.
   * @default 'none'
   */
  enumKeyCasing?: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'
  /**
   * Source of the build's `camelCase` and `pascalCase` for `enumKeyCasing`.
   */
  resolver: EnumCasing
}): [name: string | undefined, type: string] {
  const typeAlias = (annotation: TsNode) => createTypeDeclaration({ syntax: 'type', isExportable: true, name: typeName, comments: [], type: annotation })

  if (type === 'literal' || type === 'inlineLiteral') {
    const members = enums
      .map(([_key, value]) => (isNonNullable(value) ? { type: 'TSLiteralType', literal: valueToExpression(value) } : undefined))
      .filter(isNonNullable)

    return [undefined, typeAlias(members.length ? createUnionDeclaration({ nodes: members }) : keywordTypeNodes.never)]
  }

  if (type === 'enum' || type === 'constEnum') {
    const members = enums
      .map(([key, value, description]) => {
        const initializer = valueToExpression(value, Number.parseInt(value.toString(), 10) === value)
        const memberName = isNumber(Number.parseInt(key.toString(), 10)) ? `${typeName}_${key}` : key?.toString()
        if (memberName === undefined) return undefined

        const id = propertyName(applyEnumKeyCasing(memberName, enumKeyCasing, resolver))
        return appendJSDocToNode({ node: { type: 'TSEnumMember', id, initializer }, comments: [description] })
      })
      .filter(isNonNullable)

    const declaration = {
      type: 'TSEnumDeclaration',
      declare: false,
      const: type === 'constEnum',
      id: identifier(typeName),
      body: { type: 'TSEnumBody', members },
    }

    return [undefined, print(exportNamed(declaration, 'value'))]
  }

  // used when using `as const` instead of an TypeScript enum.
  // name is already cased by the caller (camelCase or pascalCase, driven by enum.constCasing).
  // typeName carries the typeSuffix for the type alias, so we use name for the const identifier.
  const identifierName = name

  // When there are no enum items (empty or all-null enum), don't generate a runtime const.
  // Return undefined for nameNode so the barrel won't try to export a non-existent symbol.
  // Use `never` as the type alias to keep references valid without creating a broken const.
  if (enums.length === 0) {
    return [undefined, typeAlias(keywordTypeNodes.never)]
  }

  // `yuku-codegen` prints object literals on one line, so each property prints on its own and the lines join here
  const properties = enums
    .map(([key, value, description]) => {
      if (key === null || key === undefined) return undefined

      const property = {
        type: 'Property',
        kind: 'init',
        key: propertyName(applyEnumKeyCasing(key.toString(), enumKeyCasing, resolver)),
        value: valueToExpression(value),
        computed: false,
        method: false,
        shorthand: false,
      }
      return print(appendJSDocToNode({ node: property, comments: [description] }))
    })
    .filter(isNonNullable)

  const query = { type: 'TSTypeQuery', exprName: identifier(identifierName), typeArguments: null }

  return [
    `export const ${identifierName} = {\n${properties.map(indent).join(',\n')},\n} as const;`,
    typeAlias({
      type: 'TSIndexedAccessType',
      objectType: { type: 'TSParenthesizedType', typeAnnotation: query },
      indexType: { type: 'TSTypeOperator', operator: 'keyof', typeAnnotation: query },
    }),
  ]
}

/**
 * Creates a TypeScript `Omit<T, Keys>` type reference.
 * Optionally wraps the type in `NonNullable<T>` if `nonNullable` is true.
 */
export function createOmitDeclaration({ keys, type, nonNullable }: { keys: Array<string> | string; type: TsNode; nonNullable?: boolean }): TsNode {
  const node = nonNullable ? createTypeReferenceNode('NonNullable', [type]) : type

  return createTypeReferenceNode('Omit', [node, createUnionDeclaration({ nodes: [keys].flat().map(createLiteralType) })])
}

/**
 * TypeScript keyword types for common primitive types.
 */
export const keywordTypeNodes = {
  any: { type: 'TSAnyKeyword' },
  unknown: { type: 'TSUnknownKeyword' },
  void: { type: 'TSVoidKeyword' },
  number: { type: 'TSNumberKeyword' },
  integer: { type: 'TSNumberKeyword' },
  bigint: { type: 'TSBigIntKeyword' },
  object: { type: 'TSObjectKeyword' },
  string: { type: 'TSStringKeyword' },
  boolean: { type: 'TSBooleanKeyword' },
  undefined: { type: 'TSUndefinedKeyword' },
  null: { type: 'TSNullKeyword' },
  never: { type: 'TSNeverKeyword' },
} as const satisfies Record<string, TsNode>

/**
 * Converts an OAS-style path (e.g. `/pets/{petId}`) or an Express-style path
 * (e.g. `/pets/:petId`) to a TypeScript template literal type
 * like `` `/pets/${string}` ``.
 */
export function createUrlTemplateType(path: string): TsNode {
  // normalized Express `:param` → OAS `{param}` so a single regex handles both.
  const normalized = path.replace(/:([^/]+)/g, '{$1}')

  if (!normalized.includes('{')) {
    return createLiteralType(normalized)
  }

  const segments = normalized.split(/\{[^}]+\}/)
  // `yuku-codegen` escapes the cooked text itself when no raw text is given
  const quasis = segments.map((cooked, i) => ({ type: 'TemplateElement', value: { cooked }, tail: i === segments.length - 1 }))

  return { type: 'TSTemplateLiteralType', quasis, types: segments.slice(1).map(() => keywordTypeNodes.string) }
}

// ─── Printer helpers ──────────────────────────────────────────────────────────

/**
 * Converts a const value to a literal type, preserving nested arrays and objects.
 */
export function constToTypeNode(value: unknown, format?: 'string' | 'number' | 'boolean'): TsNode {
  if (value === null) return keywordTypeNodes.null
  if (Array.isArray(value)) {
    return { type: 'TSTupleType', elementTypes: value.map((item) => constToTypeNode(item)) }
  }
  if (typeof value === 'object') {
    return createTypeLiteralNode(Object.entries(value).map(([name, item]) => createPropertySignature({ name, type: constToTypeNode(item) })))
  }
  if ((format ?? typeof value) === 'boolean') {
    return createLiteralType(value === true)
  }
  return createLiteralType((format ?? typeof value) === 'number' && typeof value === 'number' ? value : String(value))
}

/**
 * Returns a `Date` reference type when `representation` is `'date'`, otherwise falls back to `string`.
 */
export function dateOrStringNode(node: { representation?: string }): TsNode {
  return node.representation === 'date' ? createTypeReferenceNode('Date') : keywordTypeNodes.string
}

/**
 * Maps an array of `SchemaNode`s through the printer, filtering out `null` and `undefined` results.
 */
export function buildMemberNodes(members: Array<ast.SchemaNode> | undefined, print: (node: ast.SchemaNode) => TsNode | null | undefined): Array<TsNode> {
  return (members ?? []).map(print).filter(isNonNullable)
}

/**
 * Builds a TypeScript tuple type from an array schema's `items`,
 * applying min/max slice and optional/rest element rules.
 */
export function buildTupleNode(node: ast.ArraySchemaNode, print: (node: ast.SchemaNode) => TsNode | null | undefined): TsNode {
  let items = (node.items ?? []).map(print).filter(isNonNullable)

  const restNode = node.rest ? (print(node.rest) ?? undefined) : undefined
  const { min, max } = node

  if (max !== undefined) {
    items = items.slice(0, max)
    if (items.length < max && restNode) {
      items = [...items, ...Array(max - items.length).fill(restNode)]
    }
  }

  if (min !== undefined) {
    items = items.map((item, i) => (i >= min ? { type: 'TSOptionalType', typeAnnotation: item } : item))
  }

  if (max === undefined && restNode) {
    items.push({ type: 'TSRestType', typeAnnotation: { type: 'TSArrayType', elementType: restNode } })
  }

  return { type: 'TSTupleType', elementTypes: items }
}

/**
 * Appends `| null` and then `| undefined` to a type when requested.
 */
export function wrapNullableOptional(type: TsNode, nullable: boolean, addsUndefined: boolean): TsNode {
  const withNullable = nullable ? createUnionDeclaration({ nodes: [type, keywordTypeNodes.null] }) : type
  return addsUndefined ? createUnionDeclaration({ nodes: [withNullable, keywordTypeNodes.undefined] }) : withNullable
}

/**
 * Applies `nullable` and optional/nullish `| undefined` union modifiers to a property's resolved base type.
 */
export function buildPropertyType(
  schema: ast.SchemaNode,
  baseType: TsNode,
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined',
  optional?: boolean,
): TsNode {
  const addsUndefined = optionalType === 'undefined' || optionalType === 'questionTokenAndUndefined'
  const meta = syncSchemaRef(schema)

  return wrapNullableOptional(baseType, !!meta.nullable, addsUndefined && !!(optional || meta.nullish || meta.optional))
}

/**
 * Creates a TypeScript index signature for `additionalProperties` and `patternProperties` on an
 * object schema node. TypeScript allows only one string index signature and its value must be
 * assignable from every named property, so both keywords collapse into a single signature: the
 * union of all value types (deduplicated), or `unknown` when the object also has fixed properties.
 * The key regex of `patternProperties` cannot be expressed by an index signature and is dropped.
 */
export function buildIndexSignatures(
  node: { additionalProperties?: ast.SchemaNode | boolean; patternProperties?: Record<string, ast.SchemaNode> },
  propertyCount: number,
  printNode: (node: ast.SchemaNode) => TsNode | null | undefined,
): Array<TsNode> {
  const valueTypes: Array<TsNode> = []

  if (node.additionalProperties && node.additionalProperties !== true) {
    valueTypes.push(printNode(node.additionalProperties) ?? keywordTypeNodes.unknown)
  } else if (node.additionalProperties === true) {
    valueTypes.push(keywordTypeNodes.unknown)
  }

  for (const schema of Object.values(node.patternProperties ?? {})) {
    const patternType = printNode(schema) ?? keywordTypeNodes.unknown
    valueTypes.push(schema.nullable ? createUnionDeclaration({ nodes: [patternType, keywordTypeNodes.null] }) : patternType)
  }

  if (valueTypes.length === 0) return []

  // Deduplicate by printed text, since equal types are separate node objects
  const distinct = [...new Map(valueTypes.map((type) => [print(type), type])).values()]
  const valueType = propertyCount > 0 ? keywordTypeNodes.unknown : createUnionDeclaration({ nodes: distinct })

  return [
    {
      type: 'TSIndexSignature',
      parameters: [{ type: 'Identifier', name: 'key', typeAnnotation: { type: 'TSTypeAnnotation', typeAnnotation: keywordTypeNodes.string } }],
      typeAnnotation: { type: 'TSTypeAnnotation', typeAnnotation: valueType },
      readonly: false,
      static: false,
      accessibility: null,
    },
  ]
}
