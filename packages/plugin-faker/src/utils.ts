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

export function buildGroupedParamsSchema(params: Array<ast.ParameterNode>): ast.SchemaNode {
  return ast.createSchema({
    type: 'object',
    properties: params.map((param) =>
      ast.createProperty({
        name: param.name,
        required: param.required,
        schema: param.schema,
      }),
    ),
  })
}

export function buildResponseUnionSchema(node: ast.OperationNode, resolver: ResolverFaker): ast.SchemaNode | null {
  const responses = node.responses.filter((response) => response.schema)

  if (!responses.length) {
    return null
  }

  if (responses.length === 1) {
    return ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, responses[0]!.statusCode) })
  }

  return ast.createSchema({
    type: 'union',
    members: responses.map((response) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, response.statusCode) })),
  })
}

export function buildLegacyResponseUnionSchema(node: ast.OperationNode, resolver: ResolverFaker): ast.SchemaNode | null {
  const successResponses = node.responses.filter((response) => {
    const code = Number(response.statusCode)
    return !Number.isNaN(code) && code >= 200 && code < 300
  })

  if (!successResponses.length) {
    return null
  }

  if (successResponses.length === 1) {
    return ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, successResponses[0]!.statusCode) })
  }

  return ast.createSchema({
    type: 'union',
    members: successResponses.map((response) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, response.statusCode) })),
  })
}
