import { ast, text } from '@kubb/kit'

/**
 * Whether the node is a plain inline object whose properties can merge into another object schema.
 * Input checks, `additionalProperties`, `patternProperties`, `propertyNames`, and a nullable or
 * optional wrapper rule it out.
 */
export function isPlainInlineObject(node: ast.SchemaNode): boolean {
  if (node.type !== 'object') return false
  if (hasInputChecks(node)) return false
  if (node.nullable || node.optional || node.nullish) return false

  const hasAdditionalProperties = node.additionalProperties !== undefined
  const hasPatternProperties = Boolean(node.patternProperties)

  return !hasAdditionalProperties && !hasPatternProperties && !node.propertyNames
}

/**
 * Whether a node prints as a plain object schema, which other schemas can extend or discriminate on.
 * Covers object nodes, a `$ref` that resolves to an object or is still unresolved, a union with one
 * object member, and an object-composable `allOf`.
 *
 * A nullable or optional node, a node with input checks, and a ref into `cyclicSchemas` do not count.
 */
export function isObjectSchemaNode(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.nullable || node.optional || node.nullish) return false
  if (hasInputChecks(node)) return false
  if (node.type === 'object') {
    const hasProperties = Boolean(node.properties?.length)
    const hasTypedAdditionalProperties = Boolean(node.additionalProperties && node.additionalProperties !== true)
    const hasPatternProperties = Boolean(node.patternProperties)

    const isRecord = !hasProperties && (hasTypedAdditionalProperties || hasPatternProperties || node.propertyNames)

    return !isRecord
  }

  if (node.type === 'ref') {
    const refName = ast.ref.getName(node)
    if (refName && cyclicSchemas?.has(refName)) return false
    const resolved = ast.ref.mergeSchema(node)
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
 * Whether an `allOf` is an object base plus inline object members, so it can print as one object
 * schema and not as an intersection.
 */
export function isObjectComposableIntersection(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.type !== 'intersection') return false
  const [first, ...rest] = node.members ?? []
  return !!first && isObjectSchemaNode(first, cyclicSchemas) && rest.every(isPlainInlineObject)
}

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
    if (typeof value === 'bigint') return `BigInt(${value})`
    if (typeof value === 'number' && Number.isInteger(value)) return `BigInt(${value})`
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
 * Numeric bounds for a bigint: the inclusive, whole, safe bounds faker mocks against, and a whole, safe `multipleOf`.
 */
export function bigintConstraints({ min, max, exclusive, multipleOf }: NumericConstraints): NumericConstraints {
  return { ...ast.schema.getNumberBounds({ min, max, exclusive, integer: true }), multipleOf: Number.isSafeInteger(multipleOf) ? multipleOf : undefined }
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
export function withFormatRange<T extends NumericConstraints & { format?: string }>(
  node: T,
  type: 'integer' | 'bigint',
): Omit<T, 'min' | 'max'> & NumericBounds {
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
 * Whether `propertyNames` needs its own check. A record schema checks its keys, but an object with
 * `properties` and a record keyed by `patternProperties` do not.
 */
export function hasKeyCheck(node: ast.SchemaNode): node is ast.ObjectSchemaNode & { propertyNames: ast.SchemaNode } {
  if (node.type !== 'object' || !node.propertyNames) return false
  const hasTypedAdditionalProperties = Boolean(node.additionalProperties && node.additionalProperties !== true)

  return node.properties.length > 0 || (Boolean(node.patternProperties) && !hasTypedAdditionalProperties)
}

/**
 * Whether the node has checks that run on the raw input: `conditionals`, property counts, or a key check.
 */
export function hasInputChecks(node: ast.SchemaNode): boolean {
  return Boolean(node.conditionals?.length) || (node.type === 'object' && (node.min !== undefined || node.max !== undefined)) || hasKeyCheck(node)
}

/**
 * Marks an inline `oneOf` object strict, so a value with the keys of another member does not match it.
 */
export function strictOneOfNode(node: ast.SchemaNode): ast.SchemaNode {
  return node.type === 'object' && node.additionalProperties === undefined ? { ...node, additionalProperties: false } : node
}
