import { jsStringEscape, stringify } from '@kubb/ast/utils'
import { getOperationParameters } from '@internals/shared'
import { ast } from '@kubb/core'
import { syncSchemaRef } from '@kubb/ast/utils'
import type { ResolverTs } from './types.ts'

/**
 * Tells whether a `const` (single-value enum) should render as a bare literal type (`'active'`)
 * rather than a named enum reference or a runtime enum declaration.
 *
 * The parser folds `const` into a single-value enum node. The adapter decides which schemas are
 * named enums and lists them in `enumSchemaNames`, and references to those names get suffixed (for
 * example `StatusKey`). A const renders as a literal only when the adapter has not registered it as
 * a named enum, which keeps the declaration and its references in sync across adapter versions.
 */
export function isInlineConstEnum(node: ast.EnumSchemaNode, enumSchemaNames?: ReadonlySet<string>): boolean {
  const isConst = (node.namedEnumValues ?? node.enumValues ?? []).length === 1
  return isConst && !(node.name && enumSchemaNames?.has(node.name))
}

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
  const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters(node, { paramsCasing: 'original' })
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const hasRequiredPath = pathParams.some((param) => param.required)
  const hasRequiredQuery = queryParams.some((param) => param.required)
  const hasRequiredHeader = headerParams.some((param) => param.required)

  // NOTE(v5-stable): the fields were renamed from the legacy beta shape
  // (`data`/`pathParams`/`queryParams`/`headerParams`) to `body`/`path`/`query`/`headers` so the
  // type matches the runtime client. Drop this note once v5 leaves beta.
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
        required: hasRequiredPath,
        schema:
          pathParams.length > 0
            ? ast.factory.createSchema({ ...buildParams(node, { params: pathParams, resolver }), optional: !hasRequiredPath })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'query',
        required: hasRequiredQuery,
        schema:
          queryParams.length > 0
            ? ast.factory.createSchema({ ...buildParams(node, { params: queryParams, resolver }), optional: !hasRequiredQuery })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'headers',
        required: hasRequiredHeader,
        schema:
          headerParams.length > 0
            ? ast.factory.createSchema({ ...buildParams(node, { params: headerParams, resolver }), optional: !hasRequiredHeader })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
    ],
  })
}

export function buildResponses(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode {
  // Always emit the keyed responses map, even when an operation declares no responses. An operation
  // with no responses renders as an empty `object`, which keeps every consumer's import (for example
  // the axios SDK's `RequestResult<XResponses>`) resolvable instead of pointing at a missing export.
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
