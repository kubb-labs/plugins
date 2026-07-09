import { getOperationParameters, resolveContentTypeVariants } from '@internals/shared'
import { jsStringEscape, stringify } from '@internals/utils'
import { ast } from 'kubb/kit'
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
  const meta = ast.syncSchemaRef(schema)

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
      ? `@default ${'primitive' in meta && meta.primitive === 'string' && typeof meta.default === 'string' ? stringify(meta.default) : meta.default}`
      : null,
    ...exampleValues.map((example) => `@example ${example}`),
    meta && 'primitive' in meta && meta.primitive
      ? [`@type ${meta.primitive}`, (optional ?? isSchemaOptional(schema)) ? ' | undefined' : null].filter(Boolean).join('')
      : null,
  ].filter(Boolean)
}

type BuildParamsSchemaOptions = {
  params: Array<ast.ParameterNode>
}

type BuildOperationSchemaOptions = {
  resolver: ResolverTs
}

/**
 * Builds the object schema for a group of parameters sharing one `in` location (path, query, or
 * header), embedding each param's own schema (and JSDoc) directly rather than referencing a
 * separate per-param type — the group itself is the only type these params get exported as.
 */
export function buildParams({ params }: BuildParamsSchemaOptions): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    properties: params.map((param) =>
      ast.factory.createProperty({
        name: param.name,
        required: param.required,
        schema: ast.factory.createSchema({ ...param.schema, optional: !param.required }),
      }),
    ),
  })
}

export function buildOptions(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode {
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
          ? ast.factory.createSchema({ type: 'ref', name: resolver.response.body(node) })
          : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'path',
        required: hasRequiredPath,
        schema:
          pathParams.length > 0
            ? ast.factory.createSchema({ type: 'ref', name: resolver.param.path(node, pathParams[0]!), optional: !hasRequiredPath })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'query',
        required: hasRequiredQuery,
        schema:
          queryParams.length > 0
            ? ast.factory.createSchema({ type: 'ref', name: resolver.param.query(node, queryParams[0]!), optional: !hasRequiredQuery })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
      ast.factory.createProperty({
        name: 'headers',
        required: hasRequiredHeader,
        schema:
          headerParams.length > 0
            ? ast.factory.createSchema({ type: 'ref', name: resolver.param.headers(node, headerParams[0]!), optional: !hasRequiredHeader })
            : ast.factory.createSchema({ type: 'never', primitive: undefined, optional: true }),
      }),
    ],
  })
}

/**
 * The schema a status occupies in the `<Name>Responses` record. A status that documents several
 * content types becomes a `{ contentType; data }` union so the runtime can surface the negotiated type
 * on `result.parsed`, while the standalone `<Name>StatusNNN` alias stays the plain body union that the
 * query hooks and `result.data` use.
 */
function buildResponseRecordEntry(node: ast.OperationNode, res: ast.ResponseNode, resolver: ResolverTs): ast.SchemaNode {
  const statusName = resolver.response.status(node, res.statusCode)
  const variants = (res.content ?? []).filter((entry) => entry.schema)
  if (variants.length <= 1) {
    return ast.factory.createSchema({ type: 'ref', name: statusName })
  }

  return ast.factory.createSchema({
    type: 'union',
    members: resolveContentTypeVariants(variants, statusName).map((variant) =>
      ast.factory.createSchema({
        type: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'contentType',
            required: true,
            schema: ast.factory.createSchema({ type: 'enum', enumValues: [variant.contentType] }),
          }),
          ast.factory.createProperty({
            name: 'data',
            required: true,
            schema: ast.factory.createSchema({ type: 'ref', name: variant.name }),
          }),
        ],
      }),
    ),
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
        schema: buildResponseRecordEntry(node, res, resolver),
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
    members: responsesWithSchema.map((res) => ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, res.statusCode) })),
  })
}
