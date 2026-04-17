import { posix } from 'node:path'
import { ast } from '@kubb/core'
import type { ResolverFaker } from './types.ts'

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

export function resolveSchemaRef(node: ast.SchemaNode, schemas: Array<ast.SchemaNode>): ast.SchemaNode {
  if (node.type !== 'ref') {
    return node
  }

  return schemas.find((schema) => schema.name === node.name && schema.type !== 'ref') ?? node
}

export function resolveParamNameByLocation(
  resolver: Pick<ResolverFaker, 'resolvePathParamsName' | 'resolveQueryParamsName' | 'resolveHeaderParamsName' | 'resolveParamName'>,
  node: ast.OperationNode,
  param: ast.ParameterNode,
): string {
  switch (param.in) {
    case 'path':
      return resolver.resolvePathParamsName(node, param)
    case 'query':
      return resolver.resolveQueryParamsName(node, param)
    case 'header':
      return resolver.resolveHeaderParamsName(node, param)
    default:
      return resolver.resolveParamName(node, param)
  }
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

export function buildResponseUnionSchema(node: ast.OperationNode, resolver: ResolverFaker): ast.SchemaNode | null {
  const responses = node.responses.filter((response) => response.schema)

  if (!responses.length) {
    return null
  }

  if (responses.length === 1) {
    if (shouldInlineSingleResponseSchema(responses[0]!.schema)) {
      return responses[0]!.schema
    }

    return ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, responses[0]!.statusCode) })
  }

  return ast.createSchema({
    type: 'union',
    members: responses.map((response) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, response.statusCode) })),
  })
}

export type ImportName = string | { propertyName: string; name?: string }

export type ImportEntry = {
  name: string | Array<ImportName>
  path: string
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
const ARRAY_TYPES = new Set<ast.SchemaNode['type']>(['array'])

function toRelativeImportPath(from: string, to: string): string {
  const relativePath = posix.relative(posix.dirname(from), to)
  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function filterUsedImports(imports: Array<ImportEntry>, text: string, skipImportNames: Array<string> = []): Array<ImportEntry> {
  return imports.filter((entry) => {
    const names = (Array.isArray(entry.name) ? entry.name : [entry.name])
      .map((name) => {
        if (typeof name === 'string') {
          return name
        }

        return name?.name ?? name?.propertyName
      })
      .filter((name): name is string => Boolean(name))

    return names.some((name) => {
      if (skipImportNames.includes(name)) {
        return false
      }

      return new RegExp(`\\b${escapeRegExp(name)}\\b(?=\\s*\\()`).test(text)
    })
  })
}

export function aliasConflictingImports(
  imports: Array<ImportEntry>,
  reservedNames: Iterable<string>,
): { imports: Array<ImportEntry>; aliases: Map<string, string> } {
  const reservedNameSet = new Set(reservedNames)
  const aliases = new Map<string, string>()

  const aliasedImports = imports.map((entry) => {
    const names = Array.isArray(entry.name) ? entry.name : [entry.name]
    const aliasedNames = names.map((item): ImportName => {
      if (typeof item !== 'string' || !reservedNameSet.has(item)) {
        return item
      }

      const alias = `${item}Schema`
      aliases.set(item, alias)

      return { propertyName: item, name: alias }
    })

    return aliasedNames.some((item) => typeof item === 'object' && item.name)
      ? {
          ...entry,
          name: aliasedNames,
        }
      : entry
  })

  return {
    imports: aliasedImports,
    aliases,
  }
}

export function rewriteAliasedImports(text: string, aliases: ReadonlyMap<string, string>): string {
  return Array.from(aliases).reduce((acc, [name, alias]) => acc.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g'), alias), text)
}

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

export function getScalarType(node: ast.SchemaNode, typeName: string): string {
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

export function resolveFakerTypeUsage(
  node: ast.SchemaNode,
  typeName: string,
  canOverride: boolean,
): {
  dataType: string
  returnType: string | undefined
  usesTypeName: boolean
} {
  const isArray = ARRAY_TYPES.has(node.type)
  const isTuple = node.type === 'tuple'
  const isScalar = SCALAR_TYPES.has(node.type)

  let dataType = `Partial<${typeName}>`

  if (isArray || isTuple || node.type === 'union' || node.type === 'enum') {
    dataType = typeName
  }

  if (isScalar) {
    dataType = getScalarType(node, typeName)
  }

  let returnType = canOverride ? typeName : undefined

  if (isScalar) {
    returnType = getScalarType(node, typeName)
  }

  return {
    dataType,
    returnType,
    usesTypeName: dataType.includes(typeName) || Boolean(returnType?.includes(typeName)),
  }
}
