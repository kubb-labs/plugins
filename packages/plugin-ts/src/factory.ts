import { camelCase, pascalCase, screamingSnakeCase, snakeCase } from '@internals/utils'
import { ast } from '@kubb/core'
import { isNumber, sortBy } from 'remeda'
import ts from 'typescript'
import { OPTIONAL_ADDS_UNDEFINED } from './constants.ts'

const { SyntaxKind, factory } = ts

// https://ts-ast-viewer.com/

/**
 * TypeScript AST modifiers for common keywords (async, export, const, static).
 */
export const modifiers = {
  async: factory.createModifier(ts.SyntaxKind.AsyncKeyword),
  export: factory.createModifier(ts.SyntaxKind.ExportKeyword),
  const: factory.createModifier(ts.SyntaxKind.ConstKeyword),
  static: factory.createModifier(ts.SyntaxKind.StaticKeyword),
} as const

/**
 * TypeScript syntax kind constants for union, literal, and string types.
 */
export const syntaxKind = {
  union: SyntaxKind.UnionType as 192,
  literalType: SyntaxKind.LiteralType,
  stringLiteral: SyntaxKind.StringLiteral,
} as const

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function isValidIdentifier(str: string): boolean {
  if (!str.length || str.trim() !== str) {
    return false
  }
  const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest)

  return !!node && node.kind === ts.SyntaxKind.Identifier && ts.identifierToKeywordKind(node.kind as unknown as ts.Identifier) === undefined
}

function propertyName(name: string | ts.PropertyName): ts.PropertyName {
  if (typeof name === 'string') {
    const isValid = isValidIdentifier(name)
    return isValid ? factory.createIdentifier(name) : factory.createStringLiteral(name)
  }
  return name
}

const questionToken = factory.createToken(ts.SyntaxKind.QuestionToken)

/**
 * Creates a question token for optional type annotations.
 * Pass `true` to use the cached token, or provide a pre-created token.
 */
export function createQuestionToken(token?: boolean | ts.QuestionToken) {
  if (!token) {
    return undefined
  }
  if (token === true) {
    return questionToken
  }
  return token
}

/**
 * Creates a TypeScript intersection type node from multiple type nodes.
 * Returns the single node if only one is provided, or wraps in parentheses if requested.
 */
export function createIntersectionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode | null {
  if (!nodes.length) {
    return null
  }

  if (nodes.length === 1) {
    return nodes[0] || null
  }

  const node = factory.createIntersectionTypeNode(nodes)

  if (withParentheses) {
    return factory.createParenthesizedType(node)
  }

  return node
}

/**
 * Creates a TypeScript array type node.
 * Use `arrayType: 'array'` for bracket syntax (`T[]`), or `'generic'` for `Array<T>`.
 *
 * @example Array bracket syntax
 * `createArrayDeclaration({ nodes: [stringType], arrayType: 'array' }) // → string[]`
 *
 * @example Generic Array syntax
 * `createArrayDeclaration({ nodes: [stringType], arrayType: 'generic' }) // → Array<string>`
 */
export function createArrayDeclaration({ nodes, arrayType = 'array' }: { nodes: Array<ts.TypeNode>; arrayType?: 'array' | 'generic' }): ts.TypeNode | null {
  if (!nodes.length) {
    return factory.createTupleTypeNode([])
  }

  if (nodes.length === 1) {
    const node = nodes[0]
    if (!node) {
      return null
    }
    if (arrayType === 'generic') {
      return factory.createTypeReferenceNode(factory.createIdentifier('Array'), [node])
    }
    return factory.createArrayTypeNode(node)
  }

  // For union types (multiple nodes), respect arrayType preference
  const unionType = factory.createUnionTypeNode(nodes)
  if (arrayType === 'generic') {
    return factory.createTypeReferenceNode(factory.createIdentifier('Array'), [unionType])
  }
  // For array syntax with unions, we need parentheses: (string | number)[]
  return factory.createArrayTypeNode(factory.createParenthesizedType(unionType))
}

/**
 * Minimum nodes length of 2
 * @example Union type example
 * `string | number`
 */
export function createUnionDeclaration({ nodes, withParentheses }: { nodes: Array<ts.TypeNode>; withParentheses?: boolean }): ts.TypeNode {
  if (!nodes.length) {
    return keywordTypeNodes.any
  }

  if (nodes.length === 1) {
    return nodes[0] as ts.TypeNode
  }

  const node = factory.createUnionTypeNode(nodes)

  if (withParentheses) {
    return factory.createParenthesizedType(node)
  }

  return node
}

/**
 * Creates a TypeScript property signature for object/interface members.
 * Supports optional markers, readonly modifiers, and type annotations.
 */
export function createPropertySignature({
  readOnly,
  modifiers = [],
  name,
  questionToken,
  type,
}: {
  readOnly?: boolean
  modifiers?: Array<ts.Modifier>
  name: ts.PropertyName | string
  questionToken?: ts.QuestionToken | boolean
  type?: ts.TypeNode
}) {
  return factory.createPropertySignature(
    [...modifiers, readOnly ? factory.createToken(ts.SyntaxKind.ReadonlyKeyword) : undefined].filter(
      (modifier): modifier is ts.Modifier => modifier !== undefined,
    ),
    propertyName(name),
    createQuestionToken(questionToken),
    type,
  )
}

/**
 * Creates a function parameter declaration with optional markers, rest parameters, and type annotations.
 */
export function createParameterSignature(
  name: string | ts.BindingName,
  {
    modifiers,
    dotDotDotToken,
    questionToken,
    type,
    initializer,
  }: {
    decorators?: Array<ts.Decorator>
    modifiers?: Array<ts.Modifier>
    dotDotDotToken?: ts.DotDotDotToken
    questionToken?: ts.QuestionToken | boolean
    type?: ts.TypeNode
    initializer?: ts.Expression
  },
): ts.ParameterDeclaration {
  return factory.createParameterDeclaration(modifiers, dotDotDotToken, name, createQuestionToken(questionToken), type, initializer)
}

/**
 * Creates a JSDoc comment node from an array of comment strings.
 * Returns null if no comments are provided.
 */
export function createJSDoc({ comments }: { comments: string[] }) {
  if (!comments.length) {
    return null
  }
  return factory.createJSDocComment(
    factory.createNodeArray(
      comments.map((comment, i) => {
        if (i === comments.length - 1) {
          return factory.createJSDocText(comment)
        }

        return factory.createJSDocText(`${comment}\n`)
      }),
    ),
  )
}

/**
 * Attaches JSDoc comments to an AST node as synthetic leading comments.
 * Filters out undefined comments before attaching.
 *
 * @see https://github.com/microsoft/TypeScript/issues/44151
 */
export function appendJSDocToNode<TNode extends ts.Node>({ node, comments }: { node: TNode; comments: Array<string | undefined> }) {
  const filteredComments = comments.filter(Boolean)

  if (!filteredComments.length) {
    return node
  }

  const text = filteredComments.reduce((acc = '', comment = '') => {
    return `${acc}\n * ${comment.replaceAll('*/', '*\\/')}`
  }, '*')

  // Use the node directly instead of spreading to avoid creating Unknown nodes
  // TypeScript's addSyntheticLeadingComment accepts the node as-is
  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, `${text || '*'}\n`, true)
}

/**
 * Creates a TypeScript index signature for dynamic property access.
 * Defines the key type (default: `string`) and value type on an object.
 */
export function createIndexSignature(
  type: ts.TypeNode,
  {
    modifiers,
    indexName = 'key',
    indexType = factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  }: {
    indexName?: string
    indexType?: ts.TypeNode
    decorators?: Array<ts.Decorator>
    modifiers?: Array<ts.Modifier>
  } = {},
) {
  return factory.createIndexSignature(modifiers, [createParameterSignature(indexName, { type: indexType })], type)
}

/**
 * Creates a TypeScript type alias declaration with optional modifiers and type parameters.
 */
export function createTypeAliasDeclaration({
  modifiers,
  name,
  typeParameters,
  type,
}: {
  modifiers?: Array<ts.Modifier>
  name: string | ts.Identifier
  typeParameters?: Array<ts.TypeParameterDeclaration>
  type: ts.TypeNode
}) {
  return factory.createTypeAliasDeclaration(modifiers, name, typeParameters, type)
}

/**
 * Creates a TypeScript interface declaration with optional modifiers, type parameters, and members.
 */
export function createInterfaceDeclaration({
  modifiers,
  name,
  typeParameters,
  members,
}: {
  modifiers?: Array<ts.Modifier>
  name: string | ts.Identifier
  typeParameters?: Array<ts.TypeParameterDeclaration>
  members: Array<ts.TypeElement>
}) {
  return factory.createInterfaceDeclaration(modifiers, name, typeParameters, undefined, members)
}

/**
 * Creates a TypeScript type declaration as either a type alias or interface.
 * Intelligently selects the syntax based on the type structure and attaches JSDoc comments.
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
  name: string | ts.Identifier
  type: ts.TypeNode
}) {
  if (syntax === 'interface' && 'members' in type) {
    const node = createInterfaceDeclaration({
      members: [...(type as ts.TypeLiteralNode).members],
      modifiers: isExportable ? [modifiers.export] : [],
      name,
      typeParameters: undefined,
    })

    return appendJSDocToNode({
      node,
      comments,
    })
  }

  const node = createTypeAliasDeclaration({
    type,
    modifiers: isExportable ? [modifiers.export] : [],
    name,
    typeParameters: undefined,
  })

  return appendJSDocToNode({
    node,
    comments,
  })
}

/**
 * Creates a TypeScript namespace declaration (exported module).
 */
export function createNamespaceDeclaration({ statements, name }: { name: string; statements: ts.Statement[] }) {
  return factory.createModuleDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createIdentifier(name),
    factory.createModuleBlock(statements),
    ts.NodeFlags.Namespace,
  )
}

/**
 * Creates an import declaration with support for default imports, named imports, namespace imports, and type-only imports.
 * Optionally rename imported members with `propertyName` and `name` pairs.
 *
 * @example Default import
 * `import Pet from './Pet'`
 *
 * @example Named imports with rename
 * `import { Pet as Cat } from './Pet'`
 *
 * @example Namespace import
 * `import * as Pet from './Pet'`
 */
export function createImportDeclaration({
  name,
  path,
  isTypeOnly = false,
  isNameSpace = false,
}: {
  name: string | Array<string | { propertyName: string; name?: string }>
  path: string
  isTypeOnly?: boolean
  isNameSpace?: boolean
}) {
  if (!Array.isArray(name)) {
    const importPropertyName = isNameSpace ? undefined : factory.createIdentifier(name)
    const importName = isNameSpace ? factory.createNamespaceImport(factory.createIdentifier(name)) : undefined

    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(isTypeOnly, importPropertyName, importName),
      factory.createStringLiteral(path),
      undefined,
    )
  }

  // Sort the imports alphabetically for consistent output across platforms
  const sortedName = sortBy(name, [(item) => (typeof item === 'object' ? item.propertyName : item), 'asc'])

  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      isTypeOnly,
      undefined,
      factory.createNamedImports(
        sortedName.map((item) => {
          if (typeof item === 'object') {
            const obj = item as { propertyName: string; name?: string }
            if (obj.name) {
              return factory.createImportSpecifier(false, factory.createIdentifier(obj.propertyName), factory.createIdentifier(obj.name))
            }

            return factory.createImportSpecifier(false, undefined, factory.createIdentifier(obj.propertyName))
          }

          return factory.createImportSpecifier(false, undefined, factory.createIdentifier(item))
        }),
      ),
    ),
    factory.createStringLiteral(path),
    undefined,
  )
}

/**
 * Creates an export declaration with support for named exports, namespace exports, and type-only exports.
 * Sorts export names alphabetically for consistent output across platforms.
 */
export function createExportDeclaration({
  path,
  asAlias,
  isTypeOnly = false,
  name,
}: {
  path: string
  asAlias?: boolean
  isTypeOnly?: boolean
  name?: string | Array<ts.Identifier | string>
}) {
  if (name && !Array.isArray(name) && !asAlias) {
    console.warn(`When using name as string, asAlias should be true ${name}`)
  }

  if (!Array.isArray(name)) {
    const parsedName = name?.match(/^\d/) ? `_${name?.slice(1)}` : name

    return factory.createExportDeclaration(
      undefined,
      isTypeOnly,
      asAlias && parsedName ? factory.createNamespaceExport(factory.createIdentifier(parsedName)) : undefined,
      factory.createStringLiteral(path),
      undefined,
    )
  }

  // Sort the exports alphabetically for consistent output across platforms
  const sortedName = sortBy(name, [(propertyName) => (typeof propertyName === 'string' ? propertyName : propertyName.text), 'asc'])

  return factory.createExportDeclaration(
    undefined,
    isTypeOnly,
    factory.createNamedExports(
      sortedName.map((propertyName) => {
        return factory.createExportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
      }),
    ),
    factory.createStringLiteral(path),
    undefined,
  )
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
 * Returns a tuple of [name node, type node] - name node may be undefined for certain types.
 *
 * @example
 * ```ts
 * const [name, type] = createEnumDeclaration({
 *   type: 'enum',
 *   name: 'petType',
 *   typeName: 'PetType',
 *   enums: [['cat', 'cat'], ['dog', 'dog']],
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
   * Choose to use `enum`, `asConst`, `asPascalConst`, `constEnum`, or `literal` for enums.
   * - `enum`: TypeScript enum
   * - `asConst`: const with camelCase name (e.g., `petType`)
   * - `asPascalConst`: const with PascalCase name (e.g., `PetType`)
   * - `constEnum`: const enum
   * - `literal`: literal union type
   * @default `'enum'`
   */
  type?: 'enum' | 'asConst' | 'asPascalConst' | 'constEnum' | 'literal' | 'inlineLiteral'
  /**
   * Enum name in camelCase.
   */
  name: string
  /**
   * Enum name in PascalCase.
   */
  typeName: string
  enums: [key: string | number, value: string | number | boolean][]
  /**
   * Choose the casing for enum key names.
   * @default 'none'
   */
  enumKeyCasing?: 'screamingSnakeCase' | 'snakeCase' | 'pascalCase' | 'camelCase' | 'none'
}): [name: ts.Node | undefined, type: ts.Node] {
  if (type === 'literal' || type === 'inlineLiteral') {
    return [
      undefined,
      factory.createTypeAliasDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(typeName),
        undefined,
        factory.createUnionTypeNode(
          enums
            .map(([_key, value]) => {
              if (isNumber(value)) {
                if (value < 0) {
                  return factory.createLiteralTypeNode(
                    factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(value))),
                  )
                }
                return factory.createLiteralTypeNode(factory.createNumericLiteral(value?.toString()))
              }

              if (typeof value === 'boolean') {
                return factory.createLiteralTypeNode(value ? factory.createTrue() : factory.createFalse())
              }
              if (value) {
                return factory.createLiteralTypeNode(factory.createStringLiteral(value.toString()))
              }

              return undefined
            })
            .filter((node): node is ts.LiteralTypeNode => node !== undefined),
        ),
      ),
    ]
  }

  if (type === 'enum' || type === 'constEnum') {
    return [
      undefined,
      factory.createEnumDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword), type === 'constEnum' ? factory.createToken(ts.SyntaxKind.ConstKeyword) : undefined].filter(
          (modifier): modifier is ts.ModifierToken<ts.SyntaxKind.ExportKeyword> | ts.ModifierToken<ts.SyntaxKind.ConstKeyword> => modifier !== undefined,
        ),
        factory.createIdentifier(typeName),
        enums
          .map(([key, value]) => {
            let initializer: ts.Expression = factory.createStringLiteral(value?.toString())
            const isExactNumber = Number.parseInt(value.toString(), 10) === value

            if (isExactNumber && isNumber(Number.parseInt(value.toString(), 10))) {
              if ((value as number) < 0) {
                initializer = factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(value as number)))
              } else {
                initializer = factory.createNumericLiteral(value as number)
              }
            }

            if (typeof value === 'boolean') {
              initializer = value ? factory.createTrue() : factory.createFalse()
            }

            if (isNumber(Number.parseInt(key.toString(), 10))) {
              const casingKey = applyEnumKeyCasing(`${typeName}_${key}`, enumKeyCasing)
              return factory.createEnumMember(propertyName(casingKey), initializer)
            }

            if (key) {
              const casingKey = applyEnumKeyCasing(key.toString(), enumKeyCasing)
              return factory.createEnumMember(propertyName(casingKey), initializer)
            }

            return undefined
          })
          .filter((member): member is ts.EnumMember => member !== undefined),
      ),
    ]
  }

  // used when using `as const` instead of an TypeScript enum.
  // name is already PascalCase for asPascalConst and camelCase for asConst (set in Type.tsx)
  // typeName has the Key suffix for type alias, so we use name for the const identifier
  const identifierName = name

  // When there are no enum items (empty or all-null enum), don't generate a runtime const.
  // Return undefined for nameNode so the barrel won't try to export a non-existent symbol.
  // Use `never` as the type alias to keep references valid without creating a broken const.
  if (enums.length === 0) {
    return [
      undefined,
      factory.createTypeAliasDeclaration(
        [factory.createToken(ts.SyntaxKind.ExportKeyword)],
        factory.createIdentifier(typeName),
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
      ),
    ]
  }

  return [
    factory.createVariableStatement(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(identifierName),
            undefined,
            undefined,
            factory.createAsExpression(
              factory.createObjectLiteralExpression(
                enums
                  .map(([key, value]) => {
                    let initializer: ts.Expression = factory.createStringLiteral(value?.toString())

                    if (isNumber(value)) {
                      // Error: Negative numbers should be created in combination with createPrefixUnaryExpression factory.
                      // The method createNumericLiteral only accepts positive numbers
                      // or those combined with createPrefixUnaryExpression.
                      // Therefore, we need to ensure that the number is not negative.
                      if (value < 0) {
                        initializer = factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(value)))
                      } else {
                        initializer = factory.createNumericLiteral(value)
                      }
                    }

                    if (typeof value === 'boolean') {
                      initializer = value ? factory.createTrue() : factory.createFalse()
                    }

                    if (key) {
                      const casingKey = applyEnumKeyCasing(key.toString(), enumKeyCasing)
                      return factory.createPropertyAssignment(propertyName(casingKey), initializer)
                    }

                    return undefined
                  })
                  .filter((property): property is ts.PropertyAssignment => property !== undefined),
                true,
              ),
              factory.createTypeReferenceNode(factory.createIdentifier('const'), undefined),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    factory.createTypeAliasDeclaration(
      [factory.createToken(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier(typeName),
      undefined,
      factory.createIndexedAccessTypeNode(
        factory.createParenthesizedType(factory.createTypeQueryNode(factory.createIdentifier(identifierName), undefined)),
        factory.createTypeOperatorNode(ts.SyntaxKind.KeyOfKeyword, factory.createTypeQueryNode(factory.createIdentifier(identifierName), undefined)),
      ),
    ),
  ]
}

/**
 * Creates a TypeScript `Omit<T, Keys>` type reference node.
 * Optionally wraps the type in `NonNullable<T>` if `nonNullable` is true.
 */
export function createOmitDeclaration({ keys, type, nonNullable }: { keys: Array<string> | string; type: ts.TypeNode; nonNullable?: boolean }) {
  const node = nonNullable ? factory.createTypeReferenceNode(factory.createIdentifier('NonNullable'), [type]) : type

  if (Array.isArray(keys)) {
    return factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [
      node,
      factory.createUnionTypeNode(
        keys.map((key) => {
          return factory.createLiteralTypeNode(factory.createStringLiteral(key))
        }),
      ),
    ])
  }

  return factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [node, factory.createLiteralTypeNode(factory.createStringLiteral(keys))])
}

/**
 * Pre-built TypeScript keyword type nodes for common primitive types.
 * Use these to avoid repeatedly creating the same type nodes.
 */
export const keywordTypeNodes = {
  any: factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  unknown: factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
  void: factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  number: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  integer: factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  bigint: factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword),
  object: factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
  string: factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  boolean: factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
  undefined: factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
  null: factory.createLiteralTypeNode(factory.createToken(ts.SyntaxKind.NullKeyword)),
  never: factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
} as const

/**
 * Converts a path like '/pet/{petId}/uploadImage' to a template literal type
 * like `/pet/${string}/uploadImage`
 */
/**
 * Converts an OAS-style path (e.g. `/pets/{petId}`) or an Express-style path
 * (e.g. `/pets/:petId`) to a TypeScript template literal type
 * like `` `/pets/${string}` ``.
 */
export function createUrlTemplateType(path: string): ts.TypeNode {
  // normalized Express `:param` → OAS `{param}` so a single regex handles both.
  const normalized = path.replace(/:([^/]+)/g, '{$1}')

  if (!normalized.includes('{')) {
    return factory.createLiteralTypeNode(factory.createStringLiteral(normalized))
  }

  const segments = normalized.split(/(\{[^}]+\})/)
  const parts: string[] = []
  const parameterIndices: number[] = []

  segments.forEach((segment) => {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      parameterIndices.push(parts.length)
      parts.push(segment)
    } else if (segment) {
      parts.push(segment)
    }
  })

  const head = ts.factory.createTemplateHead(parts[0] || '')
  const templateSpans: ts.TemplateLiteralTypeSpan[] = []

  parameterIndices.forEach((paramIndex, i) => {
    const isLast = i === parameterIndices.length - 1
    const nextPart = parts[paramIndex + 1] || ''
    const literal = isLast ? ts.factory.createTemplateTail(nextPart) : ts.factory.createTemplateMiddle(nextPart)
    templateSpans.push(ts.factory.createTemplateLiteralTypeSpan(keywordTypeNodes.string, literal))
  })

  return ts.factory.createTemplateLiteralType(head, templateSpans)
}

/**
 * Creates a TypeScript type literal node (anonymous object type).
 */
export const createTypeLiteralNode = factory.createTypeLiteralNode

/**
 * Creates a TypeScript type reference node (e.g., `Array<string>`, `Record<K, V>`).
 */
export const createTypeReferenceNode = factory.createTypeReferenceNode

/**
 * Creates a numeric literal type node.
 */
export const createNumericLiteral = factory.createNumericLiteral

/**
 * Creates a string literal type node.
 */
export const createStringLiteral = factory.createStringLiteral

/**
 * Creates an array type node (e.g., `T[]`).
 */
export const createArrayTypeNode = factory.createArrayTypeNode

/**
 * Creates a parenthesized type node to control operator precedence.
 */
export const createParenthesizedType = factory.createParenthesizedType

/**
 * Creates a literal type node (e.g., `'hello'`, `42`, `true`).
 */
export const createLiteralTypeNode = factory.createLiteralTypeNode

/**
 * Creates a null literal type node.
 */
export const createNull = factory.createNull

/**
 * Creates an identifier node.
 */
export const createIdentifier = factory.createIdentifier

/**
 * Creates an optional type node (e.g., `T | undefined`).
 */
export const createOptionalTypeNode = factory.createOptionalTypeNode

/**
 * Creates a tuple type node (e.g., `[string, number]`).
 */
export const createTupleTypeNode = factory.createTupleTypeNode

/**
 * Creates a rest type node for variadic tuple elements (e.g., `...T[]`).
 */
export const createRestTypeNode = factory.createRestTypeNode

/**
 * Creates a boolean true literal type node.
 */
export const createTrue = factory.createTrue

/**
 * Creates a boolean false literal type node.
 */
export const createFalse = factory.createFalse

/**
 * Creates an indexed access type node (e.g., `T[K]`).
 */
export const createIndexedAccessTypeNode = factory.createIndexedAccessTypeNode

/**
 * Creates a type operator node (e.g., `keyof T`, `readonly T[]`).
 */
export const createTypeOperatorNode = factory.createTypeOperatorNode

/**
 * Creates a prefix unary expression (e.g., negative numbers, logical not).
 */
export const createPrefixUnaryExpression = factory.createPrefixUnaryExpression

/**
 * Exports TypeScript SyntaxKind enum for AST node type checking.
 */
export { SyntaxKind }

// ─── Printer helpers ──────────────────────────────────────────────────────────

/**
 * Converts a primitive const value to a TypeScript literal type node.
 * Handles negative numbers via a prefix unary expression.
 */
export function constToTypeNode(value: string | number | boolean, format: 'string' | 'number' | 'boolean'): ts.TypeNode | undefined {
  if (format === 'boolean') {
    return createLiteralTypeNode(value === true ? createTrue() : createFalse())
  }
  if (format === 'number' && typeof value === 'number') {
    if (value < 0) {
      return createLiteralTypeNode(createPrefixUnaryExpression(SyntaxKind.MinusToken, createNumericLiteral(Math.abs(value))))
    }
    return createLiteralTypeNode(createNumericLiteral(value))
  }
  return createLiteralTypeNode(createStringLiteral(String(value)))
}

/**
 * Returns a `Date` reference type node when `representation` is `'date'`, otherwise falls back to `string`.
 */
export function dateOrStringNode(node: { representation?: string }): ts.TypeNode {
  return node.representation === 'date' ? createTypeReferenceNode(createIdentifier('Date')) : keywordTypeNodes.string
}

/**
 * Maps an array of `SchemaNode`s through the printer, filtering out `null` and `undefined` results.
 */
export function buildMemberNodes(
  members: Array<ast.SchemaNode> | undefined,
  print: (node: ast.SchemaNode) => ts.TypeNode | null | undefined,
): Array<ts.TypeNode> {
  return (members ?? []).map(print).filter(isNonNullable)
}

/**
 * Builds a TypeScript tuple type node from an array schema's `items`,
 * applying min/max slice and optional/rest element rules.
 */
export function buildTupleNode(node: ast.ArraySchemaNode, print: (node: ast.SchemaNode) => ts.TypeNode | null | undefined): ts.TypeNode | undefined {
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
    items = items.map((item, i) => (i >= min ? createOptionalTypeNode(item) : item))
  }

  if (max === undefined && restNode) {
    items.push(createRestTypeNode(createArrayTypeNode(restNode)))
  }

  return createTupleTypeNode(items)
}

/**
 * Applies `nullable` and optional/nullish `| undefined` union modifiers to a property's resolved base type.
 */
export function buildPropertyType(
  schema: ast.SchemaNode,
  baseType: ts.TypeNode,
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined',
): ts.TypeNode {
  const addsUndefined = OPTIONAL_ADDS_UNDEFINED.has(optionalType)
  const meta = ast.syncSchemaRef(schema)

  let type = baseType

  if (meta.nullable) {
    type = createUnionDeclaration({ nodes: [type, keywordTypeNodes.null] })
  }

  if ((meta.nullish || meta.optional) && addsUndefined) {
    type = createUnionDeclaration({ nodes: [type, keywordTypeNodes.undefined] })
  }

  return type
}

/**
 * Creates TypeScript index signatures for `additionalProperties` and `patternProperties` on an object schema node.
 */
export function buildIndexSignatures(
  node: { additionalProperties?: ast.SchemaNode | boolean; patternProperties?: Record<string, ast.SchemaNode> },
  propertyCount: number,
  print: (node: ast.SchemaNode) => ts.TypeNode | null | undefined,
): Array<ts.TypeElement> {
  const elements: Array<ts.TypeElement> = []

  if (node.additionalProperties && node.additionalProperties !== true) {
    const additionalType = print(node.additionalProperties) ?? keywordTypeNodes.unknown

    elements.push(createIndexSignature(propertyCount > 0 ? keywordTypeNodes.unknown : additionalType))
  } else if (node.additionalProperties === true) {
    elements.push(createIndexSignature(keywordTypeNodes.unknown))
  }

  if (node.patternProperties) {
    const first = Object.values(node.patternProperties)[0]
    if (first) {
      let patternType = print(first) ?? keywordTypeNodes.unknown

      if (first.nullable) {
        patternType = createUnionDeclaration({ nodes: [patternType, keywordTypeNodes.null] })
      }
      elements.push(createIndexSignature(patternType))
    }
  }

  return elements
}
