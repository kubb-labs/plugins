import { ast } from '@internals/ast'
import { jsDocEscape } from '@internals/utils'
import { text } from '@kubb/kit'
import type { CoercionOptions } from './types.ts'

/**
 * Marks a property required in a later `allOf` member when an earlier member already requires it.
 */
export function preserveRequiredProperties(members: Array<ast.SchemaNode>): Array<ast.SchemaNode> {
  const hasRequiredProperty = ({
    node,
    propertyName,
    seen = new Set<ast.SchemaNode>(),
  }: {
    node: ast.SchemaNode
    propertyName: string
    seen?: Set<ast.SchemaNode>
  }): boolean => {
    if (seen.has(node)) return false
    seen.add(node)
    const resolved = ast.ref.mergeSchema(node)
    const composition = ast.schema.narrow(resolved, ast.schema.types.intersection) ?? ast.schema.narrow(resolved, ast.schema.types.union)
    // Property lookup skips unions, but a single-member union prints as its member.
    if (composition) {
      if (composition.type === ast.schema.types.union && composition.members?.length !== 1) return false
      return composition.members?.some((child) => hasRequiredProperty({ node: child, propertyName, seen })) ?? false
    }
    return ast.schema
      .findProperties({ node: resolved, propertyName })
      .some((property) => property.required !== false && !property.schema.optional && !property.schema.nullish)
  }

  return members.map((member, index) => {
    const object = ast.schema.narrow(member, ast.schema.types.object)
    if (!object || index === 0) return member

    return {
      ...object,
      properties: object.properties.map((property) => {
        const required = members.slice(0, index).some((base) => hasRequiredProperty({ node: base, propertyName: property.name }))
        if (!required) return property

        return {
          ...property,
          required: true,
          schema: { ...property.schema, optional: false, nullish: false, nullable: property.schema.nullable || property.schema.nullish },
        }
      }),
    }
  })
}

/**
 * Format a default value as a code-level literal.
 * Arrays and objects keep their contents as a JSON literal, primitives become their string
 * representation, strings are quoted.
 */
export function formatDefault(value: unknown): string {
  if (typeof value === 'string') return text.quote(value)
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)

  return String(value ?? '')
}

/**
 * Formats a default so the literal matches the type of the generated schema, or returns `null` when
 * the default should be dropped.
 *
 * An OpenAPI `default` does not always agree with its schema: a `bigint` field (`format: int64`)
 * carries a `number` default, and a spec may put `default: {}` on an `array`. Printed as they are,
 * those do not typecheck, so a bigint default becomes a `BigInt(...)` literal and a non-array default
 * on an array is dropped.
 */
export function defaultLiteral(node: ast.SchemaNode | undefined, value: unknown): string | null {
  // A `null` default is invalid on a non-nullable schema and redundant on a nullish one, and emitting
  // it produces a bare `.default()` (no argument). Drop it.
  if (value === null) return null
  const resolved = node ? ast.ref.mergeSchema(node) : undefined
  // A binary schema parses to a `Blob`, which a spec default, a string, cannot be.
  if (resolved?.type === 'blob') return null
  if (resolved && ast.schema.narrow(resolved, 'bigint')) {
    // A string keeps a value above the safe integer range exact, where a number literal is already rounded.
    // `BigInt(value)` spells a large number out in digits, where `String(1e21)` is `'1e+21'`, which `BigInt` cannot parse.
    if (typeof value === 'bigint' || (typeof value === 'number' && Number.isInteger(value))) return `BigInt('${BigInt(value)}')`
    return null
  }
  if (resolved && ast.schema.narrow(resolved, 'array')) {
    return Array.isArray(value) ? JSON.stringify(value) : null
  }
  // An enum/literal schema narrows to its members (e.g. `1 | 3`), but the spec default may not match
  // that type (`default: '1'` on a numeric enum). Emit the matching member's typed literal so the
  // default agrees with the schema, or drop a default that matches no member.
  const enumNode = resolved ? ast.schema.narrow(resolved, 'enum') : undefined
  if (enumNode) {
    const values = ast.schema.getLiterals(enumNode)
    if (values.length) {
      const match = values.find((member) => member === value || String(member) === String(value))
      return match != null ? formatDefault(match) : null
    }
  }
  return formatDefault(value)
}

/**
 * Numeric limits of a schema: min, max, exclusive bounds, and `multipleOf`.
 */
export type NumericConstraints = Pick<ast.NumberSchemaNode, 'min' | 'max' | 'exclusive' | 'multipleOf'>

/**
 * Digit pattern for a `type: 'string'` schema that carries an integer `format`, the way ProtoJSON
 * encodes 64-bit integers. Returns `undefined` for every other format, and a `pattern` from the
 * spec takes precedence over this fallback.
 *
 * @example
 * ```ts
 * integerFormatPattern('uint64') // '^\\d+$'
 * ```
 */
export function integerFormatPattern(format: string | undefined): string | undefined {
  if (format === 'int32' || format === 'int64') return '^-?\\d+$'
  if (format === 'uint64') return '^\\d+$'

  return undefined
}

/**
 * Numeric limits whose `min` and `max` may be digit strings, for 64-bit bounds a `number` cannot hold.
 */
export type NumericBounds = Omit<NumericConstraints, 'min' | 'max'> & { min?: number | string; max?: number | string }

const integerFormatRanges: Record<'integer' | 'bigint', Record<string, [min: bigint, max: bigint]>> = {
  integer: {
    int8: [-(2n ** 7n), 2n ** 7n - 1n],
    uint8: [0n, 2n ** 8n - 1n],
    int16: [-(2n ** 15n), 2n ** 15n - 1n],
    uint16: [0n, 2n ** 16n - 1n],
    int32: [-(2n ** 31n), 2n ** 31n - 1n],
    uint32: [0n, 2n ** 32n - 1n],
  },
  bigint: { int64: [-(2n ** 63n), 2n ** 63n - 1n], uint64: [0n, 2n ** 64n - 1n] },
}

/**
 * Adds the range of an integer `format` to a schema's limits. A bound from the spec stays when it
 * is at least as tight as the format's.
 *
 * @example
 * ```ts
 * withFormatRange({ format: 'int32', min: 0 }, 'integer') // { format: 'int32', min: 0, max: '2147483647' }
 * ```
 */
export function withFormatRange(node: NumericConstraints & { format?: string }, type: 'integer' | 'bigint'): NumericBounds {
  const range = node.format ? integerFormatRanges[type][node.format] : undefined
  if (!range) return node
  const [min, max] = range

  return {
    ...node,
    min: node.min === undefined || node.min < Number(min) ? String(min) : node.min,
    max: node.max === undefined || node.max > Number(max) ? String(max) : node.max,
  }
}

/**
 * Whether the node has checks that run on the raw input: `conditionals`, property counts, or a key check.
 */
export function hasInputChecks(node: ast.SchemaNode): boolean {
  return getChecks(node).some((check) => check.kind !== 'patternProperties')
}

/**
 * Marks an inline `oneOf` object strict, so a value with the keys of another member does not match it.
 */
export function strictOneOfNode(node: ast.SchemaNode): ast.SchemaNode {
  return node.type === 'object' && node.additionalProperties === undefined ? { ...node, additionalProperties: false } : node
}

/**
 * Whether the `coercion` option turns on conversion for a type.
 */
export function shouldCoerce(coercion: CoercionOptions | undefined, type: 'dates' | 'strings' | 'numbers'): boolean {
  return coercion === true || (typeof coercion === 'object' && Boolean(coercion[type]))
}

/**
 * A numeric bound as source code. A bigint bound prints as `BigInt('…')`, which is exact and
 * compiles below ES2020, where a `1n` literal does not.
 */
export function numericLiteral(value: number | string, isBigint: boolean): number | string {
  return isBigint ? `BigInt('${value}')` : value
}

/**
 * The JSDoc lines above a schema const: its description, and `@deprecated` when the spec says so.
 * A `$ref` const gets none, because the const it points to has them.
 */
export function schemaComments(node: ast.SchemaNode): Array<string> {
  if (node.type === ast.schema.types.ref) return []

  return [node.description && jsDocEscape(node.description), node.deprecated && '@deprecated'].filter((comment): comment is string => Boolean(comment))
}

/** A check that runs on a schema's raw input, named after its JSON Schema keyword. */
export type SchemaCheck =
  | { kind: 'minProperties'; value: number }
  | { kind: 'maxProperties'; value: number }
  | { kind: 'propertyNames'; schema: ast.SchemaNode }
  | { kind: 'patternProperties'; patterns: Record<string, ast.SchemaNode> }
  | ({ kind: 'conditional' } & NonNullable<ast.SchemaNode['conditionals']>[number])

function hasTypedAdditionalProperties(node: ast.ObjectSchemaNode): boolean {
  return Boolean(node.additionalProperties && node.additionalProperties !== true)
}

/**
 * The checks a schema runs on its raw input: property counts, a `propertyNames` check where a record does not already
 * check its keys, pattern keys of a closed object with properties, and each conditional.
 */
export function getChecks(node: ast.SchemaNode): Array<SchemaCheck> {
  const checks: Array<SchemaCheck> = []
  if (node.type === 'object') {
    if (node.min !== undefined) checks.push({ kind: 'minProperties', value: node.min })
    if (node.max !== undefined) checks.push({ kind: 'maxProperties', value: node.max })
    if (node.propertyNames && (node.properties.length > 0 || (Boolean(node.patternProperties) && !hasTypedAdditionalProperties(node)))) {
      checks.push({ kind: 'propertyNames', schema: node.propertyNames })
    }
    if (node.patternProperties && node.additionalProperties === false && node.properties.length > 0) {
      checks.push({ kind: 'patternProperties', patterns: node.patternProperties })
    }
  }
  for (const conditional of node.conditionals ?? []) checks.push({ kind: 'conditional', ...conditional })
  return checks
}

/** `properties`, `record` (keys from a schema), `composed` (an `allOf` that merges into one object), or `mixed` (properties plus a typed rest). */
export type ObjectKind = 'properties' | 'record' | 'composed' | 'mixed'

export type ObjectKindOptions = {
  /** From `getCircularNames`. A ref to one of them gives `null`. */
  circularSchemas?: ReadonlySet<string>
}

// A member an `allOf` can merge into its base: an object with properties only.
function isPlainInlineObject(node: ast.SchemaNode): boolean {
  return (
    node.type === 'object' &&
    !node.nullable &&
    !node.optional &&
    !node.nullish &&
    node.additionalProperties === undefined &&
    !node.patternProperties &&
    !node.propertyNames &&
    getChecks(node).length === 0
  )
}

/**
 * The shape an object-like schema prints as, or `null`. Refs and single-member unions give their target's kind, and an
 * unresolved ref counts as `properties`. A nullable or optional node, or one with input checks, gives `null`.
 */
export function getObjectKind(node: ast.SchemaNode, { circularSchemas }: ObjectKindOptions = {}): ObjectKind | null {
  // The ref targets already resolved, so a ref cycle outside `circularSchemas` ends instead of recursing forever.
  const seen = new Set<ast.SchemaNode>()

  const kindOf = (current: ast.SchemaNode): ObjectKind | null => {
    if (current.nullable || current.optional || current.nullish) return null
    if (getChecks(current).some((check) => check.kind !== 'patternProperties')) return null

    if (current.type === 'object') {
      const hasProperties = current.properties.length > 0
      const hasRest = hasTypedAdditionalProperties(current) || Boolean(current.patternProperties)
      if (!hasProperties && (hasRest || current.propertyNames)) return 'record'
      return hasProperties && hasRest ? 'mixed' : 'properties'
    }

    if (current.type === 'ref') {
      const name = ast.ref.getName(current)
      if (name && circularSchemas?.has(name)) return null
      if (!current.schema) return 'properties'
      if (seen.has(current.schema)) return null
      seen.add(current.schema)
      return kindOf(ast.ref.mergeSchema(current))
    }

    if (current.type === 'union') {
      return current.members?.length === 1 ? kindOf(current.members[0]!) : null
    }

    if (current.type === 'intersection') {
      const [first, ...rest] = current.members ?? []
      if (!first || !rest.every(isPlainInlineObject)) return null
      const base = kindOf(first)
      return base && base !== 'record' ? 'composed' : null
    }

    return null
  }

  return kindOf(node)
}

/**
 * Whether an `allOf` merges into one object. Modifiers and input checks on the `allOf` itself do not count, because the
 * printers apply them around the merged object.
 */
export function isComposedObject(node: ast.SchemaNode, options: ObjectKindOptions = {}): boolean {
  const members = { ...node, nullable: undefined, optional: undefined, nullish: undefined, conditionals: undefined }
  return getObjectKind(members, options) === 'composed'
}
