import { posix } from 'node:path'
import { getRelativePath } from '@internals/utils'
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
 * Schema types a factory cannot override with `data`: they print a constant or have no faker value.
 */
const NON_OVERRIDABLE_TYPES = new Set<ast.SchemaNode['type']>(['any', 'unknown', 'void', 'null', 'never', 'ipv4', 'ipv6'])

/**
 * Schema types a single response cannot inline: they reference or compose other schemas.
 */
const NON_INLINABLE_RESPONSE_TYPES = new Set<ast.SchemaNode['type']>(['object', 'intersection', 'ref', 'never', 'ipv4', 'ipv6'])

/**
 * Determines if a schema node can be overridden during faker generation.
 */
export function canOverrideSchema(node: ast.SchemaNode): boolean {
  return !NON_OVERRIDABLE_TYPES.has(node.type)
}

function shouldInlineSingleResponseSchema(schema: ast.SchemaNode): boolean {
  return !NON_INLINABLE_RESPONSE_TYPES.has(schema.type)
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
    const schemas = responses[0]!.content?.flatMap((content) => (content.schema ? [content.schema] : [])) ?? []
    const schema = schemas.length > 1 ? ast.factory.createSchema({ type: 'union', members: schemas }) : schemas[0]
    if (schema && shouldInlineSingleResponseSchema(schema)) {
      return schema
    }

    return ast.factory.createSchema({
      type: 'ref',
      name: resolver.response.status(node, responses[0]!.statusCode),
      schema: responses[0]!.content?.length === 1 ? schema : undefined,
    })
  }

  return ast.factory.createSchema({
    type: 'union',
    members: responses.map((response) => {
      const schema = (response.content?.length ?? 0) === 1 ? response.content?.[0]?.schema : undefined
      return ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, response.statusCode), schema })
    }),
  })
}

export const SCALAR_TYPES = new Set<ast.SchemaNode['type']>([
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
      typeName: `import('${getRelativePath(posix.dirname(filePath), typeFilePath)}').${typeName}`,
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
  // A nullable scalar inlines its primitive, so reapply the nullability the type plugin emitted.
  const resolvedNode = ast.resolveRef(node)
  const scalarType = SCALAR_TYPES.has(resolvedNode.type)
    ? `${getScalarType(resolvedNode, typeName)}${node.nullable || resolvedNode.nullable ? ' | null' : ''}`
    : undefined

  // Reference factories must accept the same overrides as the referenced factory.
  const dataType = scalarType ?? `Partial<${typeName}>`
  const returnType = scalarType ?? (canOverride ? typeName : null)

  return {
    dataType,
    returnType,
    // A non-overridable factory has no `data` param, so `dataType` never reaches the output.
    usesTypeName: (canOverride && dataType.includes(typeName)) || Boolean(returnType?.includes(typeName)),
  }
}
