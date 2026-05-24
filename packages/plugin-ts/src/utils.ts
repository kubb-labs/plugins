import { jsStringEscape, stringify } from '@internals/utils'
import { getOperationParameters } from '@internals/shared'
import { ast } from '@kubb/core'
import type { ResolverTs } from './types.ts'

/**
 * Collects JSDoc annotation strings for a schema node.
 *
 * Only uses official JSDoc tags from https://jsdoc.app/: `@description`, `@deprecated`, `@default`, `@example`, `@type`.
 * Constraint metadata (min/max length, pattern, multipleOf, min/maxProperties) is emitted as plain-text lines.

 */
export function buildPropertyJSDocComments(schema: ast.SchemaNode): Array<string | undefined> {
  const meta = ast.syncSchemaRef(schema)

  const isArray = meta?.primitive === 'array'

  const hasDescription = meta && 'description' in meta && meta.description

  const formatComment =
    meta && 'format' in meta && meta.format
      ? hasDescription
        ? // Empty line between description and format
          [' ', `Format: \`${meta.format}\``]
        : [`@description Format: \`${meta.format}\``]
      : []

  return [
    hasDescription ? `@description ${jsStringEscape(meta.description)}` : null,
    ...formatComment,
    meta && 'deprecated' in meta && meta.deprecated ? '@deprecated' : null,
    // minItems/maxItems on arrays should not be emitted as @minLength/@maxLength
    !isArray && meta && 'min' in meta && meta.min !== undefined ? `@minLength ${meta.min}` : null,
    !isArray && meta && 'max' in meta && meta.max !== undefined ? `@maxLength ${meta.max}` : null,
    meta && 'pattern' in meta && meta.pattern ? `@pattern ${meta.pattern}` : null,
    meta && 'default' in meta && meta.default !== undefined
      ? `@default ${'primitive' in meta && meta.primitive === 'string' ? stringify(meta.default as string) : meta.default}`
      : null,
    meta && 'example' in meta && meta.example !== undefined ? `@example ${meta.example}` : null,
    meta && 'primitive' in meta && meta.primitive
      ? [`@type ${meta.primitive}`, 'optional' in schema && schema.optional ? ' | undefined' : null].filter(Boolean).join('')
      : null,
  ].filter(Boolean)
}

type BuildParamsSchemaOptions = {
  params: Array<ast.ParameterNode>
  resolver: ResolverTs
}

type BuildOperationSchemaOptions = {
  resolver: ResolverTs
}

export function buildParams(node: ast.OperationNode, { params, resolver }: BuildParamsSchemaOptions): ast.SchemaNode {
  return ast.createSchema({
    type: 'object',
    properties: params.map((param) =>
      ast.createProperty({
        name: param.name,
        required: param.required,
        schema: ast.createSchema({
          type: 'ref',
          name: resolver.resolveParamName(node, param),
        }),
      }),
    ),
  })
}

export function buildData(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode {
  const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters(node)

  return ast.createSchema({
    type: 'object',
    deprecated: node.deprecated,
    properties: [
      ast.createProperty({
        name: 'data',
        schema: node.requestBody?.content?.[0]?.schema
          ? ast.createSchema({ type: 'ref', name: resolver.resolveDataName(node), optional: true })
          : ast.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.createProperty({
        name: 'pathParams',
        required: pathParams.length > 0,
        schema: pathParams.length > 0 ? buildParams(node, { params: pathParams, resolver }) : ast.createSchema({ type: 'never', primitive: undefined }),
      }),
      ast.createProperty({
        name: 'queryParams',
        schema:
          queryParams.length > 0
            ? ast.createSchema({ ...buildParams(node, { params: queryParams, resolver }), optional: true })
            : ast.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.createProperty({
        name: 'headerParams',
        schema:
          headerParams.length > 0
            ? ast.createSchema({ ...buildParams(node, { params: headerParams, resolver }), optional: true })
            : ast.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.createProperty({
        name: 'url',
        required: true,
        schema: ast.createSchema({ type: 'url', path: node.path }),
      }),
    ],
  })
}

export function buildResponses(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode | null {
  if (node.responses.length === 0) {
    return null
  }

  return ast.createSchema({
    type: 'object',
    properties: node.responses.map((res) =>
      ast.createProperty({
        name: String(res.statusCode),
        required: true,
        schema: ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) }),
      }),
    ),
  })
}

export function buildResponseUnion(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.content?.[0]?.schema)

  if (responsesWithSchema.length === 0) {
    return null
  }

  return ast.createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) => ast.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}
