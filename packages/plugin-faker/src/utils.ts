import { posix } from 'node:path'
import { ast } from 'kubb/kit'
import type { ResolverFaker } from './types.ts'

/**
 * Returns the `@faker-js/faker` named export for a locale code.
 *
 * Without a locale, returns `'faker'` for the default English instance.
 * With a locale, the language code is converted to upper case and joined with any region suffix.
 *
 * @example Default
 * `localeToFakerImport() // 'faker'`
 *
 * @example Simple locale
 * `localeToFakerImport('de') // 'fakerDE'`
 *
 * @example Compound locale
 * `localeToFakerImport('de_AT') // 'fakerDE_AT'`
 */
export function localeToFakerImport(locale?: string): string {
  if (!locale) {
    return 'faker'
  }

  const parts = locale.split('_')
  parts[0] = parts[0]!.toUpperCase()
  return `faker${parts.join('_')}`
}

/**
 * Determines if a schema node can be overridden during faker generation.
 */
export function canOverrideSchema(node: ast.SchemaNode): boolean {
  return new Set<ast.SchemaNode['type']>([
    'array',
    'tuple',
    'object',
    'intersection',
    'union',
    'enum',
    'ref',
    'string',
    'email',
    'url',
    'uuid',
    'number',
    'integer',
    'bigint',
    'boolean',
    'date',
    'time',
    'datetime',
    'blob',
  ]).has(node.type)
}

function shouldInlineSingleResponseSchema(schema: ast.SchemaNode): boolean {
  return new Set<ast.SchemaNode['type']>([
    'any',
    'unknown',
    'void',
    'null',
    'array',
    'tuple',
    'string',
    'email',
    'url',
    'uuid',
    'number',
    'integer',
    'bigint',
    'boolean',
    'date',
    'time',
    'datetime',
    'blob',
    'enum',
    'union',
  ]).has(schema.type)
}

/**
 * Builds a response schema as a union of all response statuses.
 * Returns null if no responses are provided, or embeds single simple responses inline.
 */
export function buildResponseUnionSchema(node: ast.OperationNode, resolver: ResolverFaker): ast.SchemaNode | null {
  const responses = node.responses.filter((response) => response.content?.[0]?.schema)

  if (!responses.length) {
    return null
  }

  if (responses.length === 1) {
    const schema = responses[0]!.content?.[0]?.schema
    if (schema && shouldInlineSingleResponseSchema(schema)) {
      return schema
    }

    return ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, responses[0]!.statusCode) })
  }

  return ast.factory.createSchema({
    type: 'union',
    members: responses.map((response) => ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, response.statusCode) })),
  })
}

const SCALAR_TYPES = new Set<ast.SchemaNode['type']>([
  'string',
  'email',
  'url',
  'uuid',
  'number',
  'integer',
  'bigint',
  'boolean',
  'date',
  'time',
  'datetime',
  'blob',
  'enum',
])

function toRelativeImportPath(from: string, to: string): string {
  const relativePath = posix.relative(posix.dirname(from), to)
  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

/**
 * Resolves a type reference, determining if it needs an import statement or inline type reference.
 * Takes into account whether the type can be overridden and the file paths.
 */
export function resolveTypeReference({
  node,
  canOverride,
  name,
  typeName,
  filePath,
  typeFilePath,
}: {
  node: ast.SchemaNode
  canOverride: boolean
  name: string
  typeName: string
  filePath: string
  typeFilePath: string
}): { importPath?: string; typeName: string } {
  const { usesTypeName } = resolveFakerTypeUsage(node, typeName, canOverride)

  if (!usesTypeName) {
    return { typeName }
  }

  if (name === typeName) {
    return {
      typeName: `import('${toRelativeImportPath(filePath, typeFilePath)}').${typeName}`,
    }
  }

  return {
    importPath: typeFilePath,
    typeName,
  }
}

/**
 * Maps a schema node type to its corresponding scalar type representation.
 * Returns the type name for enums or the base type (string, number, etc.) for primitives.
 */
function getScalarType(node: ast.SchemaNode, typeName: string): string {
  switch (node.type) {
    case 'string':
    case 'email':
    case 'url':
    case 'uuid':
      return 'string'
    case 'number':
    case 'integer':
      return 'number'
    case 'bigint':
      return 'bigint'
    case 'boolean':
      return 'boolean'
    case 'date':
    case 'time':
      return node.representation === 'date' ? 'Date' : 'string'
    case 'datetime':
      return 'string'
    case 'blob':
      return 'Blob'
    case 'enum':
      return typeName
    default:
      return typeName
  }
}

/**
 * Resolves faker type usage information for a schema.
 * Determines the data type, return type, and whether it uses the type name.
 */
export function resolveFakerTypeUsage(
  node: ast.SchemaNode,
  typeName: string,
  canOverride: boolean,
): {
  dataType: string
  returnType: string | null
  usesTypeName: boolean
} {
  const isArray = node.type === 'array'
  const isTuple = node.type === 'tuple'
  const isScalar = SCALAR_TYPES.has(node.type)

  let dataType = `Partial<${typeName}>`

  if (isArray || isTuple || node.type === 'union' || node.type === 'enum') {
    dataType = typeName
  }

  if (isScalar) {
    dataType = getScalarType(node, typeName)
  }

  let returnType = canOverride ? typeName : null

  if (isScalar) {
    returnType = getScalarType(node, typeName)
  }

  return {
    dataType,
    returnType,
    usesTypeName: dataType.includes(typeName) || Boolean(returnType?.includes(typeName)),
  }
}
