import { getOperationParameters } from '@internals/shared'
import { stringify, toRegExpString } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { PluginZod, ResolverZod } from './types.ts'

/**
 * Returns `true` when the given coercion option enables coercion for the specified type.
 */
export function shouldCoerce(coercion: PluginZod['resolvedOptions']['coercion'] | undefined, type: 'dates' | 'strings' | 'numbers'): boolean {
  if (coercion === undefined || coercion === false) return false
  if (coercion === true) return true

  return !!coercion[type]
}

/**
 * A codec for a schema node whose runtime type differs from its JSON wire type:
 * the output (response) schema decodes wire → runtime, and the input (request)
 * variant encodes runtime → wire.
 *
 * To support another codec type, append a `Codec` to `codecs` and route that
 * type's printer node handler through `getCodec`.
 */
export type Codec = {
  /**
   * Whether this node is encoded/decoded by this codec.
   */
  matches(node: ast.SchemaNode): boolean
  /**
   * Output direction (response): decode the wire value into the runtime type.
   */
  decode(node: ast.SchemaNode): string
  /**
   * Input direction (request): encode the runtime value back to the wire value.
   */
  encode(node: ast.SchemaNode): string
}

/**
 * `dateType: 'date'` fields are typed as `Date` but travel as ISO `string`s.
 * Output decodes `string → Date`; input encodes `Date → string`, preserving the
 * `date` (`YYYY-MM-DD`) vs `date-time` precision carried on `node.format`.
 */
const dateCodec: Codec = {
  matches(node) {
    return node.type === 'date' && node.representation === 'date'
  },
  decode(node) {
    return node.format === 'date' ? 'z.iso.date().transform((value) => new Date(value))' : 'z.iso.datetime().transform((value) => new Date(value))'
  },
  encode(node) {
    return node.format === 'date' ? 'z.date().transform((value) => value.toISOString().slice(0, 10))' : 'z.date().transform((value) => value.toISOString())'
  },
}

/**
 * Registered codecs, checked in order.
 */
const codecs: Array<Codec> = [dateCodec]

/**
 * Returns the codec for this node, or `undefined` when the node needs no
 * encode/decode (its wire and runtime types match).
 */
export function getCodec(node: ast.SchemaNode | undefined): Codec | undefined {
  if (!node) return undefined
  return codecs.find((codec) => codec.matches(node))
}

/**
 * Returns `true` when the node itself is encoded/decoded by a codec.
 */
export function hasCodec(node: ast.SchemaNode | undefined): boolean {
  return getCodec(node) !== undefined
}

/**
 * Returns `true` when the schema transitively contains a codec node —
 * a value whose runtime type differs from its wire type (see {@link hasCodec}),
 * so it must be decoded (response) or encoded (request) at the validation boundary.
 * `$ref`s are followed via their resolved schema; a `seen` set guards cycles.
 */
export function containsCodec(node: ast.SchemaNode | undefined, seen: Set<string> = new Set()): boolean {
  if (!node) return false

  if (hasCodec(node)) return true

  if (node.type === 'ref') {
    if (!node.ref) return false
    const refName = ast.extractRefName(node.ref)
    if (refName) {
      if (seen.has(refName)) return false
      seen.add(refName)
    }
    const resolved = ast.syncSchemaRef(node)
    if (resolved.type === 'ref') return false
    return containsCodec(resolved, seen)
  }

  const children: Array<ast.SchemaNode | undefined> = []
  if ('properties' in node && node.properties) children.push(...node.properties.map((prop) => prop.schema))
  if ('items' in node && node.items) children.push(...node.items)
  if ('members' in node && node.members) children.push(...node.members)
  if ('additionalProperties' in node && node.additionalProperties && node.additionalProperties !== true) children.push(node.additionalProperties)

  return children.some((child) => containsCodec(child, seen))
}

/**
 * Collects the names of `$ref` schemas that transitively contain a codec, so the generator can route
 * them to their input (encode) variant.
 */
export function collectCodecRefNames(node: ast.SchemaNode): Array<string> {
  return ast.collect<string>(node, {
    schema: (n) => (n.type === 'ref' && n.ref && containsCodec(n) ? (ast.resolveRefName(n) ?? undefined) : undefined),
  })
}

/**
 * Whether the node is a plain inline object whose shape can be lifted into an `.extend({ … })`
 * argument. A catchall, `patternProperties`, or a nullable/optional wrapper cannot, so those stay
 * on `.and(…)`.
 */
function isPlainInlineObject(node: ast.SchemaNode): boolean {
  return node.type === 'object' && !node.nullable && !node.optional && !node.nullish && node.additionalProperties === undefined && !node.patternProperties
}

/**
 * Whether a node renders as a bare Zod object — one that accepts `.extend(…)` and can be a
 * `z.discriminatedUnion` option. Covers object nodes, `$ref`s that resolve to (or are still
 * unresolved) objects, single-member unions of an object, and object-composable `allOf`.
 *
 * `cyclicSchemas` bounds the recursion: a ref into a cycle renders as `z.lazy(…)`, not an object.
 */
export function isObjectSchemaNode(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.nullable || node.optional || node.nullish) return false
  if (node.type === 'object') return true

  if (node.type === 'ref') {
    const refName = ast.resolveRefName(node)
    if (refName && cyclicSchemas?.has(refName)) return false
    const resolved = ast.syncSchemaRef(node)
    // An unresolved ref keeps its `ref` type; assume it resolves to an object (matches the printer's
    // prior optimism that only a resolved intersection blocks a discriminated union).
    return resolved.type === 'ref' || isObjectSchemaNode(resolved, cyclicSchemas)
  }

  if (node.type === 'union') {
    const members = node.members ?? []
    return members.length === 1 && isObjectSchemaNode(members[0]!, cyclicSchemas)
  }

  return isObjectComposableIntersection(node, cyclicSchemas)
}

/**
 * Whether an `allOf` is a pure object composition — an object base plus inline object members whose
 * shapes merge with `.extend(…)`. These stay a Zod object instead of a `ZodIntersection`, which
 * `z.discriminatedUnion` rejects.
 */
export function isObjectComposableIntersection(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.type !== 'intersection') return false
  const [first, ...rest] = node.members ?? []
  return !!first && isObjectSchemaNode(first, cyclicSchemas) && rest.every(isPlainInlineObject)
}

/**
 * Format a default value as a code-level literal.
 * Objects become `{}`, primitives become their string representation, strings are quoted.
 */
export function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return '{}'

  return String(value ?? '')
}

/**
 * Format a default for `.default(...)` so the literal matches the generated schema's type.
 *
 * An OpenAPI `default` does not always agree with the schema it sits on: a `bigint` field
 * (`format: int64`) carries a `number` default, and a spec may put `default: {}` on an `array`.
 * Emitting those verbatim produces a Zod schema that does not typecheck, so coerce the bigint case
 * to a `BigInt(...)` literal and emit an array literal for arrays (dropping a non-array default).
 * Returns `null` when no `.default(...)` should be emitted. Keys off the schema node's type.
 */
export function defaultLiteral(node: ast.SchemaNode | undefined, value: unknown): string | null {
  // A `null` default is invalid on a non-nullable schema and redundant on a nullish one, and emitting
  // it produces a bare `.default()` (no argument). Drop it.
  if (value === null) return null
  if (node && ast.narrowSchema(node, 'bigint')) {
    if (typeof value === 'bigint') return `BigInt(${value})`
    if (typeof value === 'number' && Number.isInteger(value)) return `BigInt(${value})`
    return null
  }
  if (node && ast.narrowSchema(node, 'array')) {
    return Array.isArray(value) ? JSON.stringify(value) : null
  }
  // An enum/literal schema narrows to its members (e.g. `1 | 3`), but the spec default may not match
  // that type (`default: '1'` on a numeric enum). Emit the matching member's typed literal so the
  // default agrees with the schema, or drop a default that matches no member.
  const enumNode = node ? ast.narrowSchema(node, 'enum') : undefined
  if (enumNode) {
    const values = enumNode.namedEnumValues?.map((member) => member.value) ?? enumNode.enumValues ?? []
    if (values.length) {
      const match = values.find((member) => member === value || String(member) === String(value))
      return match != null ? formatLiteral(match) : null
    }
  }
  return formatDefault(value)
}

/**
 * Format a primitive enum/literal value.
 * Strings are quoted; numbers and booleans are emitted raw.
 */
export function formatLiteral(v: string | number | boolean): string {
  if (typeof v === 'string') return stringify(v)

  return String(v)
}

/**
 * Build the Zod schema for a set of literal enum values.
 * `z.enum()` only accepts string members in Zod v4, so a numeric, boolean, or
 * mixed set is emitted as a single `z.literal(…)` or a `z.union([z.literal(…), …])`.
 * An all-string set keeps the more compact `z.enum([…])`.
 */
export function buildEnum(values: Array<string | number | boolean>): string {
  const allStrings = values.every((v) => typeof v === 'string')
  if (allStrings) return `z.enum([${values.map(formatLiteral).join(', ')}])`

  const literals = values.map((v) => `z.literal(${formatLiteral(v)})`)
  if (literals.length === 1) return literals[0]!

  return `z.union([${literals.join(', ')}])`
}

/**
 * Numeric constraint limits for Zod schemas (min, max, and exclusive bounds).
 */
export type NumericConstraints = {
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

/**
 * Length constraint limits for string and array schemas (min, max, and regex pattern).
 */
export type LengthConstraints = {
  min?: number
  max?: number
  pattern?: string
  /**
   * Output form for the `pattern` regex. `'literal'` emits a regex literal,
   * `'constructor'` emits `new RegExp(...)`.
   *
   * @default 'literal'
   */
  regexType?: PluginZod['resolvedOptions']['regexType']
}

/**
 * Map a `regexType` to the `func` argument of `toRegExpString`: `'constructor'` emits
 * `new RegExp(...)`, while `'literal'` (the default) emits a regex literal.
 */
function regexFunc(regexType: PluginZod['resolvedOptions']['regexType'] | undefined): string | null {
  return regexType === 'constructor' ? 'RegExp' : null
}

/**
 * Builds a Zod record key schema that enforces the `patternProperties` regexes a plain
 * `.catchall()` would drop. Several patterns combine into one alternation (`(^a)|(^b)`).
 */
export function patternKeySchema({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  return `z.string().regex(${patternKeySource({ patterns, regexType })})`
}

/**
 * `zod/mini` variant of {@link patternKeySchema}, wrapping the regex in `.check(z.regex(...))`.
 */
export function patternKeySchemaMini({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  return `z.string().check(z.regex(${patternKeySource({ patterns, regexType })}))`
}

function patternKeySource({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  const source = patterns.length === 1 ? patterns[0]! : patterns.map((pattern) => `(${pattern})`).join('|')
  return toRegExpString(source, regexFunc(regexType))
}

/**
 * Modifier options for applying chainable methods to Zod schema values.
 */
export type ModifierOptions = {
  value: string
  schema?: ast.SchemaNode
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
  description?: string
  examples?: Array<unknown>
}

/**
 * Build `.min()` / `.max()` / `.gt()` / `.lt()` constraint chains for numbers
 * using the standard chainable Zod v4 API.
 */
export function numberConstraints({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : '',
    exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : '',
    multipleOf !== undefined ? `.multipleOf(${multipleOf})` : '',
  ].join('')
}

/**
 * Build `.min()` / `.max()` / `.regex()` chains for strings/arrays
 * using the standard chainable Zod v4 API.
 */
export function lengthConstraints({ min, max, pattern, regexType }: LengthConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    pattern !== undefined ? `.regex(${toRegExpString(pattern, regexFunc(regexType))})` : '',
  ].join('')
}

/**
 * Build `.check(z.minimum(), z.maximum())` for `zod/mini` numeric constraints.
 */
export function numberChecksMini({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): string {
  const checks: Array<string> = []
  if (min !== undefined) checks.push(`z.minimum(${min})`)
  if (max !== undefined) checks.push(`z.maximum(${max})`)
  if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
  if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
  if (multipleOf !== undefined) checks.push(`z.multipleOf(${multipleOf})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Build `.check(z.minLength(), z.maxLength(), z.regex())` for `zod/mini` length constraints.
 */
export function lengthChecksMini({ min, max, pattern, regexType }: LengthConstraints): string {
  const checks: Array<string> = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  if (pattern !== undefined) checks.push(`z.regex(${toRegExpString(pattern, regexFunc(regexType))})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Apply nullable / optional / nullish modifiers, an optional `.describe()` call, and an
 * optional `.meta({ examples })` call to a schema value string using the chainable Zod v4 API.
 */
export function applyModifiers({ value, schema, nullable, optional, nullish, defaultValue, description, examples }: ModifierOptions): string {
  const withModifier = (() => {
    if (nullish || (nullable && optional)) return `${value}.nullish()`
    if (optional) return `${value}.optional()`
    if (nullable) return `${value}.nullable()`
    return value
  })()
  const literal = defaultValue !== undefined ? defaultLiteral(schema, defaultValue) : null
  const withDefault = literal !== null ? `${withModifier}.default(${literal})` : withModifier
  const withDescription = description ? `${withDefault}.describe(${stringify(description)})` : withDefault
  return examples?.length ? `${withDescription}.meta({ examples: [${examples.map(formatDefault).join(', ')}] })` : withDescription
}

function modifierDepth(schema: ast.SchemaNode): number {
  if (schema.nullish || (schema.nullable && schema.optional)) return 2
  if (schema.nullable || schema.optional) return 1
  return 0
}

/**
 * Build the `.unwrap()` chain to insert before `.omit()` when the schema is a `$ref`.
 *
 * A `$ref` resolves to a named schema variable that already carries its own `.nullable()` /
 * `.optional()` / `.nullish()` / `.default()` wrappers. `.omit()` lives on the inner `ZodObject`,
 * not on those `ZodNullable` / `ZodOptional` / `ZodDefault` wrappers, so the omit has to unwrap
 * down to the object first. This mirrors plugin-ts emitting `Omit<NonNullable<T>, …>`. Inline
 * objects need no unwrap because the printer adds their modifiers after `.omit()`.
 */
export function omitUnwrapChain(node: ast.SchemaNode): string {
  const ref = ast.narrowSchema(node, 'ref')
  if (!ref) return ''

  const target = ref.schema ?? ref
  const depth = modifierDepth(target) + (target.default !== undefined ? 1 : 0)
  return '.unwrap()'.repeat(depth)
}

/**
 * Apply nullable / optional / nullish modifiers using the functional `zod/mini` API
 * (`z.nullable()`, `z.optional()`, `z.nullish()`).
 */
export function applyMiniModifiers({ value, schema, nullable, optional, nullish, defaultValue }: Omit<ModifierOptions, 'description'>): string {
  const withModifier = (() => {
    if (nullish) return `z.nullish(${value})`
    const withNullable = nullable ? `z.nullable(${value})` : value
    return optional ? `z.optional(${withNullable})` : withNullable
  })()
  const literal = defaultValue !== undefined ? defaultLiteral(schema, defaultValue) : null
  return literal !== null ? `z._default(${withModifier}, ${literal})` : withModifier
}

type BuildGroupedParamsSchemaOptions = {
  params: Array<ast.ParameterNode>
  optional?: boolean
}

/**
 * Builds an `object` schema node grouping the given parameter nodes.
 * The `primitive: 'object'` marker ensures the Zod printer emits `z.object(…)` rather than a record.
 */
export function buildGroupedParamsSchema({ params, optional }: BuildGroupedParamsSchemaOptions): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    optional,
    primitive: 'object',
    properties: params.map((param) =>
      ast.factory.createProperty({
        name: param.name,
        required: param.required,
        schema: param.schema,
      }),
    ),
  })
}

type BuildOptionsSchemaOptions = {
  resolver: ResolverZod
}

/**
 * Builds the combined `{ body, path, query, headers }` options object schema for an operation,
 * referencing the already-resolved body and grouped param schema names. Mirrors `@kubb/plugin-ts`'s
 * `buildOptions`, so a type source can be swapped between the two plugins without changing the shape
 * consumers destructure. Only meaningful when `inferred: true`, since that's what backs the
 * `resolver.response.options(node)` type name with a real declaration.
 */
export function buildOptionsSchema(node: ast.OperationNode, { resolver }: BuildOptionsSchemaOptions): ast.SchemaNode {
  const { path: pathParams, query: queryParams, header: headerParams } = getOperationParameters(node)
  const hasBody = Boolean(node.requestBody?.content?.[0]?.schema)
  const hasRequiredPath = pathParams.some((param) => param.required)
  const hasRequiredQuery = queryParams.some((param) => param.required)
  const hasRequiredHeader = headerParams.some((param) => param.required)

  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    deprecated: node.deprecated,
    properties: [
      ast.factory.createProperty({
        name: 'body',
        required: hasBody,
        schema: hasBody
          ? ast.factory.createSchema({ type: 'ref', name: resolver.response.body(node), optional: !hasBody })
          : ast.factory.createSchema({ type: 'never', optional: true }),
      }),
      ast.factory.createProperty({
        name: 'path',
        required: hasRequiredPath,
        schema:
          pathParams.length > 0
            ? ast.factory.createSchema({ type: 'ref', name: resolver.param.path(node, pathParams[0]!), optional: !hasRequiredPath })
            : ast.factory.createSchema({ type: 'never', optional: true }),
      }),
      ast.factory.createProperty({
        name: 'query',
        required: hasRequiredQuery,
        schema:
          queryParams.length > 0
            ? ast.factory.createSchema({ type: 'ref', name: resolver.param.query(node, queryParams[0]!), optional: !hasRequiredQuery })
            : ast.factory.createSchema({ type: 'never', optional: true }),
      }),
      ast.factory.createProperty({
        name: 'headers',
        required: hasRequiredHeader,
        schema:
          headerParams.length > 0
            ? ast.factory.createSchema({ type: 'ref', name: resolver.param.headers(node, headerParams[0]!), optional: !hasRequiredHeader })
            : ast.factory.createSchema({ type: 'never', optional: true }),
      }),
    ],
  })
}
