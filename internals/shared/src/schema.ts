import { ast, text } from '@kubb/kit'

/**
 * Whether the node is a plain inline object whose shape can be lifted into an `.extend({ … })`
 * argument. Input checks, a catchall, `patternProperties`, or a nullable/optional wrapper cannot, so those stay
 * on `.and(…)`.
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
 * Whether a node renders as a bare Zod object — one that accepts `.extend(…)` and can be a
 * `z.discriminatedUnion` option. Covers object nodes, `$ref`s that resolve to (or are still
 * unresolved) objects, single-member unions of an object, and object-composable `allOf`.
 *
 * Input checks, such as property counts and `conditionals`, render as a pipe. A ref into `cyclicSchemas` renders as `z.lazy(…)`.
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
 * Whether an `allOf` is a pure object composition — an object base plus inline object members whose
 * shapes merge with `.extend(…)`. These stay a Zod object instead of a `ZodIntersection`, which
 * `z.discriminatedUnion` rejects.
 */
export function isObjectComposableIntersection(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.type !== 'intersection') return false
  const [first, ...rest] = node.members ?? []
  return !!first && isObjectSchemaNode(first, cyclicSchemas) && rest.every(isPlainInlineObject)
}

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
 * Numeric constraint limits for Zod schemas (min, max, and exclusive bounds).
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
 * Whether `propertyNames` needs its own check: `z.record` checks the keys of a map, but `z.object` and a record keyed by
 * `patternProperties` do not.
 */
export function hasKeyCheck(node: ast.SchemaNode): node is ast.ObjectSchemaNode & { propertyNames: ast.SchemaNode } {
  if (node.type !== 'object' || !node.propertyNames) return false
  const hasTypedAdditionalProperties = Boolean(node.additionalProperties && node.additionalProperties !== true)

  return node.properties.length > 0 || (Boolean(node.patternProperties) && !hasTypedAdditionalProperties)
}

/**
 * Whether the node prints inside `z.pipe(z.unknown().check(…), …)`, see {@link inputChecks}.
 */
export function hasInputChecks(node: ast.SchemaNode): boolean {
  return Boolean(node.conditionals?.length) || (node.type === 'object' && (node.min !== undefined || node.max !== undefined)) || hasKeyCheck(node)
}

/**
 * Marks an inline `oneOf` object strict, so `object()` builds `z.strictObject(...)` and no eager `.shape` read hits a deferred getter.
 */
export function strictOneOfNode(node: ast.SchemaNode): ast.SchemaNode {
  return node.type === 'object' && node.additionalProperties === undefined ? { ...node, additionalProperties: false } : node
}
