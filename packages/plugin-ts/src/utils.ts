import { jsStringEscape, stringify } from '@kubb/ast/utils'
import { getOperationParameters } from '@internals/shared'
import { ast } from '@kubb/core'
import { syncSchemaRef } from '@kubb/ast/utils'
import type { ResolverTs } from './types.ts'

/**
 * Collects JSDoc annotation strings for a schema node.
 *
 * Only uses official JSDoc tags from https://jsdoc.app/: `@description`, `@deprecated`, `@default`, `@example`, `@type`.
 * Constraint metadata (min/max length, pattern, multipleOf, min/maxProperties) is emitted as plain-text lines.

 */
function isSchemaOptional(schema: ast.SchemaNode): boolean {
  return Boolean(('optional' in schema && schema.optional) || ('nullish' in schema && schema.nullish))
}

export function buildPropertyJSDocComments(schema: ast.SchemaNode, optional?: boolean): Array<string | undefined> {
  const meta = syncSchemaRef(schema)

  const isArray = meta?.primitive === 'array'

  const hasDescription = meta && 'description' in meta && meta.description

  const formatComment =
    meta && 'format' in meta && meta.format
      ? hasDescription
        ? // Empty line between description and format
          [' ', `Format: \`${meta.format}\``]
        : ['@description', `Format: \`${meta.format}\``]
      : []

  // OAS 3.1 carries schema examples as an `examples` array, one `@example` line each.
  const exampleValues = meta?.examples ?? []

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
    ...exampleValues.map((example) => `@example ${example}`),
    meta && 'primitive' in meta && meta.primitive
      ? [`@type ${meta.primitive}`, (optional ?? isSchemaOptional(schema)) ? ' | undefined' : null].filter(Boolean).join('')
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
  return ast.factory.createSchema({
    type: 'object',
    properties: params.map((param) =>
      ast.factory.createProperty({
        name: param.name,
        required: param.required,
        schema: ast.factory.createSchema({
          type: 'ref',
          name: resolver.resolveParamName(node, param),
          optional: !param.required,
        }),
      }),
    ),
  })
}

export function buildData(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode {
  const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters(node)
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)

  return ast.factory.createSchema({
    type: 'object',
    deprecated: node.deprecated,
    properties: [
      ast.factory.createProperty({
        name: 'body',
        required: hasBody,
        schema: hasBody
          ? ast.factory.createSchema({ type: 'ref', name: resolver.resolveDataName(node) })
          : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'path',
        schema:
          pathParams.length > 0
            ? ast.factory.createSchema({ ...buildParams(node, { params: pathParams, resolver }), optional: true })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'query',
        schema:
          queryParams.length > 0
            ? ast.factory.createSchema({ ...buildParams(node, { params: queryParams, resolver }), optional: true })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'headers',
        schema:
          headerParams.length > 0
            ? ast.factory.createSchema({ ...buildParams(node, { params: headerParams, resolver }), optional: true })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'url',
        required: true,
        schema: ast.factory.createSchema({ type: 'url', path: node.path }),
      }),
    ],
  })
}

export function buildResponses(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode | null {
  if (node.responses.length === 0) {
    return null
  }

  return ast.factory.createSchema({
    type: 'object',
    properties: node.responses.map((res) =>
      ast.factory.createProperty({
        name: String(res.statusCode),
        required: true,
        schema: ast.factory.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) }),
      }),
    ),
  })
}

export function buildResponseUnion(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode | null {
  const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))

  if (responsesWithSchema.length === 0) {
    return null
  }

  return ast.factory.createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) => ast.factory.createSchema({ type: 'ref', name: resolver.resolveResponseStatusName(node, res.statusCode) })),
  })
}
