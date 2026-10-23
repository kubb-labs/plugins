import ts from '@typescript/typescript6'

/**
 * A span map segment in the tuple form TypeScript reads:
 * `[virtualStart, virtualLength, originalStart, originalLength, kind, features]`.
 */
export type Segment = [number, number, number, number, number, number]

/**
 * What the build saw, keyed by the names `@kubb/plugin-ts` emitted.
 */
export type Targets = {
  /**
   * Emitted type name to the `components.schemas` key it came from.
   */
  schemas: Map<string, string>
  /**
   * Emitted operation name prefix (such as `GetPetById`) to its path and method.
   */
  operations: Map<string, { path: string; method: string }>
}

type Locate = (pointer: string) => { start: number; end: number } | undefined

const kindVerbatim = 0
const kindAlias = 2
// Hover, Definition, TypeDefinition, Implementation, References, DocumentHighlights.
const features = 1 | 8 | 16 | 32 | 64 | 128
// Only verbatim segments can write a rename back to the spec. Schema names get it: a `$ref` the
// rename leaves behind shows as an unresolved-ref error. Property keys do not, since a `required`
// list it leaves behind would silently make the property optional.
const renameFeature = 256

const escapeToken = (token: string) => token.replaceAll('~', '~0').replaceAll('/', '~1')

/**
 * Narrows an operation type to the part of the operation it was generated from, by the suffix
 * `@kubb/plugin-ts` appends to the operation name.
 */
function operationPointer(base: string, suffix: string): string {
  const status = /^Status(\d{3}|Default)/.exec(suffix)?.[1]
  if (status) return `${base}/responses/${status === 'Default' ? 'default' : status}`
  if (/^(Path|Query|Header)/.test(suffix)) return `${base}/parameters`
  if (/^(Body|Request|MutationRequest)/.test(suffix)) return `${base}/requestBody`
  return base
}

const longestPrefix = (keys: Iterable<string>, name: string) => [...keys].filter((key) => name.startsWith(key)).sort((a, b) => b.length - a.length)[0]

/**
 * Pointers to try for one declaration, most specific first. Enums extracted from a schema property
 * (`OrderStatusEnumKey`, `orderStatusEnum`) point at that property, then at the schema.
 */
function declarationPointers(name: string, { schemas, operations }: Targets): Array<string> {
  const schema = schemas.get(name)
  if (schema) return [`#/components/schemas/${escapeToken(schema)}`]

  const schemaPrefix = longestPrefix(schemas.keys(), name)
  const operationPrefix = longestPrefix(operations.keys(), name)

  if (schemaPrefix !== undefined && (operationPrefix === undefined || schemaPrefix.length > operationPrefix.length)) {
    const base = `#/components/schemas/${escapeToken(schemas.get(schemaPrefix)!)}`
    const property = name.slice(schemaPrefix.length).replace(/(Enum)?Key$|Enum$/, '')
    return property ? [`${base}/properties/${escapeToken(property[0]!.toLowerCase() + property.slice(1))}`, base] : [base]
  }
  if (operationPrefix === undefined) return []

  const { path, method } = operations.get(operationPrefix)!
  return [operationPointer(`#/paths/${escapeToken(path)}/${method.toLowerCase()}`, name.slice(operationPrefix.length))]
}

/** The object literal a property type describes, looking through `T[]` and `Array<T>`. */
function objectLiteral(type: ts.TypeNode | undefined): { node: ts.TypeLiteralNode; items: boolean } | undefined {
  if (!type) return undefined
  if (ts.isTypeLiteralNode(type)) return { node: type, items: false }
  if (ts.isArrayTypeNode(type) && ts.isTypeLiteralNode(type.elementType)) return { node: type.elementType, items: true }
  if (ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Array' && type.typeArguments?.[0] && ts.isTypeLiteralNode(type.typeArguments[0])) {
    return { node: type.typeArguments[0], items: true }
  }
  return undefined
}

/** The members of an interface, or of a type alias for an object literal. */
function typeMembers(statement: ts.TypeAliasDeclaration | ts.InterfaceDeclaration): ts.NodeArray<ts.TypeElement> | undefined {
  if (ts.isInterfaceDeclaration(statement)) return statement.members
  return ts.isTypeLiteralNode(statement.type) ? statement.type.members : undefined
}

/**
 * Builds span map segments that link generated declaration and property names to the keys they
 * came from in the spec, so go to definition, hover and find references cross between the two.
 *
 * Declarations of component schemas map to `components.schemas.<name>`, their properties to
 * `properties.<name>` (nested object literals and arrays of them included), and operation types to
 * the operation, its parameters, request body or response. A name `locate` cannot place is left
 * synthesized. A schema type named exactly like its key is a verbatim segment, so renaming it in
 * TypeScript renames the key in the spec.
 */
export function createMappings(text: string, content: string, locate: Locate, targets: Targets): Array<Segment> {
  const sourceFile = ts.createSourceFile('index.ts', text, ts.ScriptTarget.Latest, true)
  const segments: Array<Segment> = []

  const add = (name: ts.Node, ...pointers: Array<string>) => {
    const range = pointers.map(locate).find(Boolean)
    if (range) segments.push([name.getStart(sourceFile), name.getWidth(sourceFile), range.start, range.end - range.start, kindAlias, features])
  }

  /** A component schema declared under its own key, such as `Pet`, renames that key in the spec. */
  const addSchema = (name: ts.Identifier, pointer: string) => {
    const range = locate(pointer)
    if (!range) return
    const verbatim = content.slice(range.start, range.end) === name.text
    segments.push([
      name.getStart(sourceFile),
      name.getWidth(sourceFile),
      range.start,
      range.end - range.start,
      verbatim ? kindVerbatim : kindAlias,
      verbatim ? features | renameFeature : features,
    ])
  }

  const addMembers = (members: ts.NodeArray<ts.TypeElement>, pointer: string) => {
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !(ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) continue
      const propertyPointer = `${pointer}/properties/${escapeToken(member.name.text)}`
      add(member.name, propertyPointer)
      const literal = objectLiteral(member.type)
      if (literal) addMembers(literal.node.members, literal.items ? `${propertyPointer}/items` : propertyPointer)
    }
  }

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      // Enum objects (`export const orderStatusEnum = { ... } as const`) match like their `Key` type.
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        const name = declaration.name.text
        add(declaration.name, ...declarationPointers(name, targets), ...declarationPointers(name[0]!.toUpperCase() + name.slice(1), targets))
      }
      continue
    }
    if (!ts.isTypeAliasDeclaration(statement) && !ts.isInterfaceDeclaration(statement)) continue
    const pointers = declarationPointers(statement.name.text, targets)
    const isSchema = targets.schemas.has(statement.name.text)
    const pointer = pointers[0]
    if (isSchema && pointer) addSchema(statement.name, pointer)
    else add(statement.name, ...pointers)

    // Property names only resolve under a schema, not under operation parameters or responses.
    if (!pointer || !isSchema) continue
    const members = typeMembers(statement)
    if (members) addMembers(members, pointer)
  }

  return segments
}
