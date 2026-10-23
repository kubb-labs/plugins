import { camelCase, pascalCase, screamingSnakeCase, snakeCase } from '@internals/utils'
import { syncSchemaRef } from 'kubb/kit'
import type { ast } from 'kubb/kit'

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

export function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

const controlCharacters: Record<string, string> = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\v': '\\v', '\f': '\\f', '\r': '\\r' }

/**
 * Escapes backslashes, `quote` and control characters so `text` can sit between two `quote` characters.
 */
function escapeText(text: string, quote: string): string {
  // oxlint-disable-next-line no-control-regex -- control characters are exactly what needs escaping
  return text.replace(new RegExp(`[\\\\${quote}\\u0000-\\u001f\\u2028\\u2029]`, 'g'), (char) => {
    if (char === '\\' || char === quote) return `\\${char}`
    return controlCharacters[char] ?? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  })
}

/**
 * Prints `text` as a single-quoted string literal.
 */
export function createStringLiteral(text: string): string {
  return `'${escapeText(text, "'")}'`
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
 * Walks `type` and reports the top-level characters, skipping string literals, template literals, comments and
 * anything nested in brackets. Returns the depth-0 text with nested parts blanked out, plus whether the whole type is
 * one bracketed block that starts at index 0.
 */
function scanTopLevel(type: string): { topLevel: string; closesAt: number } {
  let depth = 0
  let topLevel = ''
  let closesAt = -1

  for (let i = 0; i < type.length; i++) {
    const char = type[i]!

    if (char === "'" || char === '"' || char === '`') {
      let end = i + 1
      while (end < type.length && type[end] !== char) end += type[end] === '\\' ? 2 : 1
      i = end
      if (depth === 0) topLevel += ' '
      continue
    }
    if (char === '/' && type[i + 1] === '*') {
      i = type.indexOf('*/', i + 2) + 1 || type.length
      continue
    }
    if (char === '{' || char === '(' || char === '[' || char === '<') depth++
    if (char === '}' || char === ')' || char === ']' || (char === '>' && type[i - 1] !== '=')) {
      depth--
      if (depth === 0 && closesAt === -1) closesAt = i
      continue
    }
    if (depth === 0) topLevel += char
  }

  return { topLevel, closesAt }
}

/**
 * Whether `type` is an anonymous object type such as `{ a: string }`.
 */
export function isTypeLiteral(type: string): boolean {
  return type.startsWith('{') && scanTopLevel(type).closesAt === type.length - 1
}

/**
 * Wraps `type` in parentheses when it is a union, intersection, function, `keyof`, `typeof` or conditional type, so a
 * postfix such as `[]` or `?` binds to the whole type.
 */
function parenthesize(type: string): string {
  const { topLevel } = scanTopLevel(type)
  if (/[|&?]|=>|^\s*(?:keyof|typeof|unique|readonly|infer|new)\s/.test(topLevel)) return `(${type})`
  return type
}

/**
 * Creates a TypeScript intersection type.
 * Returns the single type if only one is provided, or wraps in parentheses if requested.
 */
export function createIntersectionDeclaration({ nodes, withParentheses }: { nodes: Array<string>; withParentheses?: boolean }): string | null {
  if (!nodes.length) {
    return null
  }

  if (nodes.length === 1) {
    return nodes[0] || null
  }

  // Union members of an intersection need parentheses to keep their meaning
  const node = nodes.map((member) => (/[|]/.test(scanTopLevel(member).topLevel) ? `(${member})` : member)).join(' & ')

  return withParentheses ? `(${node})` : node
}

/**
 * Creates a TypeScript array type.
 * Use `arrayType: 'array'` for bracket syntax (`T[]`), or `'generic'` for `Array<T>`.
 *
 * @example Array bracket syntax
 * `createArrayDeclaration({ nodes: ['string'], arrayType: 'array' }) // → string[]`
 *
 * @example Generic Array syntax
 * `createArrayDeclaration({ nodes: ['string'], arrayType: 'generic' }) // → Array<string>`
 */
export function createArrayDeclaration({ nodes, arrayType = 'array' }: { nodes: Array<string>; arrayType?: 'array' | 'generic' }): string {
  if (!nodes.length) {
    return '[]'
  }

  const node = nodes.length === 1 ? nodes[0]! : nodes.join(' | ')

  return arrayType === 'generic' ? `Array<${node}>` : `${parenthesize(node)}[]`
}

/**
 * Minimum nodes length of 2
 * @example Union type example
 * `string | number`
 */
export function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<string>; withParentheses?: boolean }): string {
  if (!nodes.length) {
    return keywordTypeNodes.any
  }

  if (nodes.length === 1) {
    return nodes[0]!
  }

  const node = nodes.join(' | ')

  return withParentheses ? `(${node})` : node
}

/**
 * Whether `name` can be written as a bare property name instead of a quoted string.
 */
function isValidIdentifier(name: string): boolean {
  return /^[\p{ID_Start}$_][\p{ID_Continue}$‌‍]*$/u.test(name)
}

/**
 * Prints a property or enum member name, quoting it when it is not a valid identifier.
 */
function propertyName(name: string): string {
  return isValidIdentifier(name) ? name : createStringLiteral(name)
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
  type?: string
}): string {
  return `${readOnly ? 'readonly ' : ''}${propertyName(name)}${questionToken ? '?' : ''}${type ? `: ${type}` : ''}`
}

/**
 * Puts a JSDoc block built from `comments` above `node`, dropping empty comments.
 */
export function appendJSDocToNode({ node, comments }: { node: string; comments: Array<string | undefined> }): string {
  const lines = comments.filter(Boolean).flatMap((comment = '') => comment.split(/\r?\n/))

  if (!lines.length) {
    return node
  }

  return ['/**', ...lines.map((line) => ` * ${line.replaceAll('*/', '*\\/')}`.trimEnd()), ' */', node].join('\n')
}

/**
 * Creates a TypeScript type literal (anonymous object type) with one member per line.
 */
export function createTypeLiteralNode(members: Array<string>): string {
  if (!members.length) {
    return '{}'
  }

  return `{\n${members.map(indent).join('\n')}\n}`
}

/**
 * Creates a TypeScript type reference (e.g., `Array<string>`, `Record<K, V>`).
 */
export function createTypeReferenceNode(name: string, typeArguments?: Array<string>): string {
  return typeArguments?.length ? `${name}<${typeArguments.join(', ')}>` : name
}

/**
 * Creates a TypeScript type declaration as either a type alias or interface.
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
  type: string
}): string {
  const exportKeyword = isExportable ? 'export ' : ''
  const node = syntax === 'interface' && isTypeLiteral(type) ? `${exportKeyword}interface ${name} ${type}` : `${exportKeyword}type ${name} = ${type}`

  return appendJSDocToNode({ node, comments })
}

/**
 * Converts an enum member value to a literal. Numbers become numeric literals unless `asNumber` is `false`,
 * which emits the string form.
 */
function valueToExpression(value: string | number | boolean, asNumber = isNumber(value)): string {
  if (typeof value === 'boolean') {
    return String(value)
  }
  if (asNumber && isNumber(value)) {
    return String(value)
  }
  return createStringLiteral(value.toString())
}

/**
 * Apply casing transformation to enum keys
 */
function applyEnumKeyCasing(key: string, casing: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none' = 'none'): string {
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
    return pascalCase(key)
  }
  if (casing === 'camelCase') {
    return camelCase(key)
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
}): [name: string | undefined, type: string] {
  if (type === 'literal' || type === 'inlineLiteral') {
    const members = enums.map(([_key, value]) => (isNonNullable(value) ? valueToExpression(value) : undefined)).filter(isNonNullable)

    return [undefined, `export type ${typeName} = ${members.join(' | ') || keywordTypeNodes.never}`]
  }

  if (type === 'enum' || type === 'constEnum') {
    const members = enums
      .map(([key, value, description]) => {
        const initializer = valueToExpression(value, Number.parseInt(value.toString(), 10) === value)

        if (isNumber(Number.parseInt(key.toString(), 10))) {
          const casingKey = applyEnumKeyCasing(`${typeName}_${key}`, enumKeyCasing)
          return appendJSDocToNode({ node: `${propertyName(casingKey)} = ${initializer}`, comments: [description] })
        }

        if (key !== null && key !== undefined) {
          const casingKey = applyEnumKeyCasing(key.toString(), enumKeyCasing)
          return appendJSDocToNode({ node: `${propertyName(casingKey)} = ${initializer}`, comments: [description] })
        }

        return undefined
      })
      .filter(isNonNullable)

    const body = members.length ? `{\n${members.map(indent).join(',\n')},\n}` : '{}'

    return [undefined, `export ${type === 'constEnum' ? 'const ' : ''}enum ${typeName} ${body}`]
  }

  // used when using `as const` instead of an TypeScript enum.
  // name is already cased by the caller (camelCase or pascalCase, driven by enum.constCasing).
  // typeName carries the typeSuffix for the type alias, so we use name for the const identifier.
  const identifierName = name

  // When there are no enum items (empty or all-null enum), don't generate a runtime const.
  // Return undefined for nameNode so the barrel won't try to export a non-existent symbol.
  // Use `never` as the type alias to keep references valid without creating a broken const.
  if (enums.length === 0) {
    return [undefined, `export type ${typeName} = ${keywordTypeNodes.never}`]
  }

  const properties = enums
    .map(([key, value, description]) => {
      if (key !== null && key !== undefined) {
        const casingKey = applyEnumKeyCasing(key.toString(), enumKeyCasing)
        return appendJSDocToNode({ node: `${propertyName(casingKey)}: ${valueToExpression(value)}`, comments: [description] })
      }

      return undefined
    })
    .filter(isNonNullable)

  return [
    `export const ${identifierName} = {\n${properties.map(indent).join(',\n')},\n} as const`,
    `export type ${typeName} = (typeof ${identifierName})[keyof typeof ${identifierName}]`,
  ]
}

/**
 * Creates a TypeScript `Omit<T, Keys>` type reference.
 * Optionally wraps the type in `NonNullable<T>` if `nonNullable` is true.
 */
export function createOmitDeclaration({ keys, type, nonNullable }: { keys: Array<string> | string; type: string; nonNullable?: boolean }): string {
  const node = nonNullable ? createTypeReferenceNode('NonNullable', [type]) : type
  const omitted = [keys].flat().map(createStringLiteral).join(' | ')

  return createTypeReferenceNode('Omit', [node, omitted])
}

/**
 * TypeScript keyword types for common primitive types.
 */
export const keywordTypeNodes = {
  any: 'any',
  unknown: 'unknown',
  void: 'void',
  number: 'number',
  integer: 'number',
  bigint: 'bigint',
  object: 'object',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
  never: 'never',
} as const

/**
 * Converts an OAS-style path (e.g. `/pets/{petId}`) or an Express-style path
 * (e.g. `/pets/:petId`) to a TypeScript template literal type
 * like `` `/pets/${string}` ``.
 */
export function createUrlTemplateType(path: string): string {
  // normalized Express `:param` → OAS `{param}` so a single regex handles both.
  const normalized = path.replace(/:([^/]+)/g, '{$1}')

  if (!normalized.includes('{')) {
    return createStringLiteral(normalized)
  }

  const template = normalized
    .split(/(\{[^}]+\})/)
    .map((segment) => (segment.startsWith('{') && segment.endsWith('}') ? `\${${keywordTypeNodes.string}}` : escapeText(segment, '`').replaceAll('${', '\\${')))
    .join('')

  return `\`${template}\``
}

// ─── Printer helpers ──────────────────────────────────────────────────────────

/**
 * Converts a primitive const value to a TypeScript literal type.
 */
export function constToTypeNode(value: string | number | boolean, format: 'string' | 'number' | 'boolean'): string | undefined {
  if (format === 'boolean') {
    return String(value === true)
  }
  const literal = format === 'number' && typeof value === 'number' ? value : String(value)
  return valueToExpression(literal)
}

/**
 * Returns a `Date` reference type when `representation` is `'date'`, otherwise falls back to `string`.
 */
export function dateOrStringNode(node: { representation?: string }): string {
  return node.representation === 'date' ? createTypeReferenceNode('Date') : keywordTypeNodes.string
}

/**
 * Maps an array of `SchemaNode`s through the printer, filtering out `null` and `undefined` results.
 */
export function buildMemberNodes(members: Array<ast.SchemaNode> | undefined, print: (node: ast.SchemaNode) => string | null | undefined): Array<string> {
  return (members ?? []).map(print).filter(isNonNullable)
}

/**
 * Builds a TypeScript tuple type from an array schema's `items`,
 * applying min/max slice and optional/rest element rules.
 */
export function buildTupleNode(node: ast.ArraySchemaNode, print: (node: ast.SchemaNode) => string | null | undefined): string {
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
    items = items.map((item, i) => (i >= min ? `${parenthesize(item)}?` : item))
  }

  if (max === undefined && restNode) {
    items.push(`...${parenthesize(restNode)}[]`)
  }

  return `[${items.join(', ')}]`
}

/**
 * Appends `| null` and then `| undefined` to a type when requested.
 */
export function wrapNullableOptional(type: string, nullable: boolean, addsUndefined: boolean): string {
  const withNullable = nullable ? createUnionDeclaration({ nodes: [type, keywordTypeNodes.null] }) : type
  return addsUndefined ? createUnionDeclaration({ nodes: [withNullable, keywordTypeNodes.undefined] }) : withNullable
}

/**
 * Applies `nullable` and optional/nullish `| undefined` union modifiers to a property's resolved base type.
 */
export function buildPropertyType(
  schema: ast.SchemaNode,
  baseType: string,
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined',
  optional?: boolean,
): string {
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
  print: (node: ast.SchemaNode) => string | null | undefined,
): Array<string> {
  const valueTypes: Array<string> = []

  if (node.additionalProperties && node.additionalProperties !== true) {
    valueTypes.push(print(node.additionalProperties) ?? keywordTypeNodes.unknown)
  } else if (node.additionalProperties === true) {
    valueTypes.push(keywordTypeNodes.unknown)
  }

  for (const schema of Object.values(node.patternProperties ?? {})) {
    const patternType = print(schema) ?? keywordTypeNodes.unknown
    valueTypes.push(schema.nullable ? createUnionDeclaration({ nodes: [patternType, keywordTypeNodes.null] }) : patternType)
  }

  if (valueTypes.length === 0) return []

  const type = propertyCount > 0 ? keywordTypeNodes.unknown : createUnionDeclaration({ nodes: [...new Set(valueTypes)] })

  return [`[key: string]: ${type}`]
}
