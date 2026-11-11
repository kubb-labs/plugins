import { jsDocEscape } from '@internals/utils'
import { ast, code } from '@kubb/kit'
import { getEnumNames } from './components/Enum.tsx'
import type { PluginTs, ResolverTs } from './types.ts'

/**
 * Renames inline enum declarations and their uses together.
 */
export function resolveInlineEnumNames({
  node,
  owner,
  resolver,
  enumOptions,
}: {
  node: ast.SchemaNode
  owner: string
  resolver: ResolverTs
  enumOptions: PluginTs['resolvedOptions']['enum']
}): ast.SchemaNode {
  return ast.transform(node, {
    schema(child) {
      if (child === node || child.type !== 'enum' || !child.name) return
      const name = resolver.resolveName({
        key: ['enum', owner, child.pointer ?? child.name],
        name: child.name,
        normalize: (value) => {
          // An `asConst` enum emits a value and a type alias, and the name has to be free as both.
          const { enumName, typeName } = getEnumNames({ node: { ...child, name: value }, enum: enumOptions, resolver })
          return enumOptions.type === 'literal' ? [typeName] : [enumName, typeName]
        },
      })
      return name === child.name ? undefined : { ...child, name }
    },
  })
}

/**
 * Resolves the type name an enum schema is referenced by. An enum emitted as a `const` object
 * with a `typeSuffix` uses its suffixed key alias (e.g. `StatusKey`); every other schema uses its
 * plain resolved name.
 */
type EnumTypeNameProps = {
  resolver: ResolverTs
  name: string
  enumOptions: { type?: string; typeSuffix?: string } | undefined
  isEnum: boolean
}

export function enumTypeName({ resolver, name, enumOptions, isEnum }: EnumTypeNameProps): string {
  return isEnum && enumOptions?.type === 'asConst' && enumOptions.typeSuffix ? resolver.enum.keyName({ name }, enumOptions.typeSuffix) : resolver.name(name)
}

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

function isSchemaOptional(schema: ast.SchemaNode): boolean {
  return Boolean(('optional' in schema && schema.optional) || ('nullish' in schema && schema.nullish))
}

function formatExample(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return String(value)
  }

  const rendered = JSON.stringify(value) ?? String(value)
  return rendered.replaceAll('*/', '*\\/')
}

/**
 * Whether a schema is binary, or an array of binary items, so its TypeScript type is `Blob` or `Blob[]`.
 */
export function isBinarySchema(schema: ast.SchemaNode): boolean {
  const meta = ast.ref.sync(schema)
  const isBlob = (node: ast.SchemaNode) => ast.ref.sync(node)?.type === 'blob'
  return !!meta && (isBlob(meta) || (meta.type === 'array' && 'items' in meta && (meta.items ?? []).some(isBlob)))
}

/**
 * Collects JSDoc annotation strings for a schema node.
 *
 * Only uses official JSDoc tags from https://jsdoc.app/: `@description`, `@deprecated`, `@minimum`, `@maximum`, `@minLength`,
 * `@maxLength`, `@pattern`, `@default`, `@example`, `@see` and `@type`.
 */
export function buildPropertyJSDocComments(schema: ast.SchemaNode, optional?: boolean): Array<string | undefined> {
  const meta = ast.ref.sync(schema)

  const isArray = meta?.primitive === 'array'
  // An object's `min`/`max` count properties, which no JSDoc tag describes.
  const isObject = meta?.type === 'object'
  const isNumeric = meta?.primitive === 'number' || meta?.primitive === 'integer' || meta?.primitive === 'bigint'

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

  const comments = [
    hasDescription ? `@description ${jsDocEscape(meta.description)}` : null,
    ...formatComment,
    meta && 'deprecated' in meta && meta.deprecated ? '@deprecated' : null,
    // minItems/maxItems on arrays should not be emitted as @minLength/@maxLength
    !isArray && !isObject && meta && 'min' in meta && meta.min !== undefined ? `@${isNumeric ? 'minimum' : 'minLength'} ${meta.min}` : null,
    !isArray && !isObject && meta && 'max' in meta && meta.max !== undefined ? `@${isNumeric ? 'maximum' : 'maxLength'} ${meta.max}` : null,
    meta && 'pattern' in meta && meta.pattern ? `@pattern ${meta.pattern}` : null,
    meta && 'default' in meta && meta.default !== undefined
      ? `@default ${'primitive' in meta && meta.primitive === 'string' && typeof meta.default === 'string' ? code.string(meta.default) : formatExample(meta.default)}`
      : null,
    ...exampleValues.map((example) => `@example ${formatExample(example)}`),
    meta?.externalDocs ? `@see ${jsDocEscape([meta.externalDocs.url, meta.externalDocs.description].filter(Boolean).join(' '))}` : null,
  ].filter(Boolean)

  // `@type` merely repeats the TypeScript type already sitting next to the property, so it only
  // earns its place inside a comment block that exists for another reason. Bare, it would just
  // add bytes with no information a reader can't already see in the signature.
  const typeTag =
    // A binary schema's primitive is `string`, which would contradict its `Blob` type.
    comments.length && !isBinarySchema(schema) && meta && 'primitive' in meta && meta.primitive
      ? [`@type ${meta.primitive}`, (optional ?? isSchemaOptional(schema)) ? ' | undefined' : null].filter(Boolean).join('')
      : null

  return [...comments, typeTag].filter(Boolean)
}

/**
 * The example values. With `serialized`, each `serializedValue` is added as a `<caption>Serialized</caption>` example.
 */
export function getExampleValues(examples: Array<ast.ExampleNode> | undefined, serialized = false): Array<unknown> | undefined {
  const values = (examples ?? []).flatMap((example) => [
    ...(example.value !== undefined ? [example.value] : []),
    ...(serialized && example.serializedValue !== undefined ? [`<caption>Serialized</caption> ${jsDocEscape(example.serializedValue)}`] : []),
  ])
  return values.length > 0 ? values : undefined
}

/**
 * The JSDoc lines of a response type: `@summary`, and one `@see` per link, such as `@see getPet: getPet({ petId: $response.body#/id })`.
 */
export function buildResponseComments(response: ast.ResponseNode): Array<string> {
  const links = Object.entries(response.links ?? {}).map(([name, link]) => {
    const values = { ...link.parameters, ...(link.requestBody !== undefined ? { body: link.requestBody } : {}) }
    const args = Object.entries(values).map(([key, value]) => `${key}: ${formatExample(value)}`)
    return `@see ${jsDocEscape(`${name}: ${link.operationId ?? link.operationRef ?? ''}(${args.length ? `{ ${args.join(', ')} }` : ''})`)}`
  })
  return [...(response.summary ? [`@summary ${jsDocEscape(response.summary)}`] : []), ...links]
}

type BuildParamsSchemaOptions = {
  params: Array<ast.ParameterNode>
  /**
   * Adds each serialized example to `examples` as a `<caption>Serialized</caption>` JSDoc line.
   * Leave it off when `examples` must hold values, such as for mocks.
   */
  serializedExamples?: boolean
}

type BuildOperationSchemaOptions = {
  resolver: ResolverTs
}

/**
 * Builds the object schema for one parameter group or a response's headers. Each entry embeds its own schema and JSDoc,
 * so the group is the only type these entries are exported as.
 */
export function buildParams({ params, serializedExamples }: BuildParamsSchemaOptions): ast.SchemaNode {
  const pointer = params[0]?.pointer
  return ast.factory.createSchema({
    type: 'object',
    // The group points at the `parameters` list or `headers` map that declares its first parameter.
    pointer: pointer?.slice(0, pointer.lastIndexOf('/')),
    properties: params.map((param) =>
      ast.factory.createProperty({
        name: param.name,
        required: param.required,
        schema: ast.factory.createSchema({
          ...param.schema,
          optional: !param.required,
          deprecated: param.deprecated || param.schema.deprecated,
          examples: getExampleValues(param.examples, serializedExamples) ?? param.schema.examples,
        }),
      }),
    ),
  })
}

export function buildResponseUnion(node: ast.OperationNode, { resolver }: BuildOperationSchemaOptions): ast.SchemaNode | null {
  const allWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
  // Only 2xx responses, so an `unknown` error body cannot erase the success typing. Falls back to all responses when no 2xx has a schema.
  const successWithSchema = allWithSchema.filter((res) => ast.http.status.isSuccess(res))
  const responsesWithSchema = successWithSchema.length > 0 ? successWithSchema : allWithSchema

  if (responsesWithSchema.length === 0) {
    return null
  }

  return ast.factory.createSchema({
    type: 'union',
    members: responsesWithSchema.map((res) => ast.factory.createSchema({ type: 'ref', name: resolver.response.status(node, res.statusCode) })),
  })
}
