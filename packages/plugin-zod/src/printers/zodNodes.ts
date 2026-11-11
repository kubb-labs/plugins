import { jsonContentSchema, mapSchemaItems, mapSchemaMembers } from '@internals/shared'
import { buildList, stringify } from '@internals/utils'
import { ast, syncSchemaRef } from '@kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import {
  buildEnum,
  buildLiteral,
  type buildObjectShape,
  CONTENT_ENCODING_CALLS,
  getMemberConstraint,
  integerFormatPattern,
  jsonContentCheck,
  isClosedKeySchema,
  isObjectComposableIntersection,
  isObjectSchemaNode,
  type lengthConstraints,
  type numberConstraints,
  objectConstraints,
  type patternKeySchema,
  preserveRequiredProperties,
  shouldCoerce,
  strictOneOfNode,
  STRING_FORMAT_CALLS,
} from '../utils.ts'

/**
 * The options both Zod printers read in the shared handlers.
 */
export type ZodNodeOptions = {
  coercion?: PluginZod['resolvedOptions']['coercion']
  guidType?: PluginZod['resolvedOptions']['guidType']
  regexType?: PluginZod['resolvedOptions']['regexType']
  oneOfType?: PluginZod['resolvedOptions']['oneOfType']
  resolver?: ResolverZod
  cyclicSchemas?: ReadonlySet<string>
  direction?: 'encode' | 'decode'
  nodes?: Partial<Record<ast.SchemaType, unknown>>
}

/**
 * The strings that differ between the chainable `zod` API and the functional `zod/mini` API.
 */
export type ZodDialect<TOptions extends ZodNodeOptions = ZodNodeOptions> = {
  lengths: typeof lengthConstraints
  numbers: typeof numberConstraints
  patternKey: typeof patternKeySchema
  objectShape: (ctx: Parameters<typeof buildObjectShape>[0], node: ast.SchemaNode) => string
  /**
   * The coerced integer base, without its numeric checks.
   */
  coercedInt: string
  /**
   * Wraps a schema so its input is coerced to a number before the schema checks it.
   */
  coercedNumber: (schema: string) => string
  catchall: (object: string, value: string) => string
  nullable: (value: string) => string
  unique: (array: string) => string
  /**
   * Adds a `refine` to a schema. `check` is the callback with its params, as `jsonContentCheck` builds it.
   */
  refine: (value: string, check: string) => string
  extend: (base: string, shape: string) => string
  intersection: (left: string, right: string) => string
  /**
   * Post-processes a member of a strict `oneOf`. `zod/mini` has no chainable `.strict()`, so it leaves this unset.
   */
  strictMember?: (member: string, schema: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>) => string
  /**
   * Whether a `$ref` resolves to its `${name}InputSchema` variant. `zod/mini` is direction-free, so it leaves this unset.
   */
  useInputVariant?: (node: ast.SchemaNode, options: TOptions) => boolean
}

/**
 * Reads a union of bare single-value enums as one enum, except under `xor` or an enum override, which need each member.
 * Only a numeric union with a `format` coerces, because it printed as `z.coerce.number()` before the adapter kept its values.
 */
function getLiteralUnion({
  node,
  options,
}: {
  node: ast.UnionSchemaNode
  options: ZodNodeOptions
}): { values: Array<string | number | boolean>; coerce: boolean } | undefined {
  if ((node.strategy === 'one' && options.oneOfType === 'xor') || options.nodes?.enum) return undefined
  const values = (node.members ?? []).map((member) => {
    const enumNode = ast.narrowSchema(member, ast.schemaTypes.enum)
    return enumNode && !enumNode.name && !enumNode.nullable && !enumNode.namedEnumValues && enumNode.enumValues?.length === 1
      ? enumNode.enumValues[0]
      : undefined
  })
  if (!values.length || !values.every((value): value is string | number | boolean => value !== undefined && value !== null)) return undefined

  return { values, coerce: !!node.format && values.every((value) => typeof value === 'number') && shouldCoerce(options.coercion, 'numbers') }
}

/**
 * Whether a discriminated union member's discriminator property prints as a coerced literal union.
 */
function hasCoercedDiscriminator({ member, propertyName, options }: { member: ast.SchemaNode; propertyName: string; options: ZodNodeOptions }): boolean {
  return ast.resolveSchemaProperties({ node: member, propertyName }).some(({ schema }) => {
    const resolved = syncSchemaRef(schema)
    return resolved.type === 'union' && !!getLiteralUnion({ node: resolved, options })?.coerce
  })
}

// `z.discriminatedUnion` rejects a member without literal discriminator values, such as an OpenAPI 3.2 `defaultMapping`.
function hasPlainDiscriminator({ member, propertyName }: { member: ast.SchemaNode; propertyName: string }): boolean {
  const schemas = ast.resolveSchemaProperties({ node: member, propertyName })
  return schemas.length > 0 && !schemas.some(({ schema }) => ast.getSchemaLiteralValues(syncSchemaRef(schema)).length > 0)
}

/**
 * Builds the scalar handlers both dialects share. Only a string with a `contentSchema` recurses into a child. The temporal
 * scalars and `bigint` differ per dialect, so each printer adds its own.
 */
export function buildScalarNodes<TOptions extends ZodNodeOptions>(dialect: ZodDialect<TOptions>): ast.PrinterPartial<string, TOptions> {
  return {
    any: () => 'z.any()',
    unknown: () => 'z.unknown()',
    void: () => 'z.void()',
    never: () => 'z.never()',
    boolean: () => 'z.boolean()',
    null: () => 'z.null()',
    string(node) {
      const coerce = shouldCoerce(this.options.coercion, 'strings')
      const call = coerce ? undefined : (STRING_FORMAT_CALLS.get(node.format) ?? CONTENT_ENCODING_CALLS.get(node.content?.encoding?.toLowerCase()))
      const base = call ?? (coerce ? 'z.coerce.string()' : 'z.string()')
      const pattern = node.pattern ?? integerFormatPattern(node.format)
      const value = `${base}${dialect.lengths({ ...node, pattern, regexType: this.options.regexType })}`

      const contentNode = jsonContentSchema(node)
      if (!contentNode) return value
      // The string holds wire JSON whichever way the string itself travels, so its schema always decodes.
      const direction = this.options.direction
      this.options.direction = 'decode'
      const contentSchema = this.transform(contentNode)
      this.options.direction = direction

      return contentSchema ? dialect.refine(value, jsonContentCheck(contentSchema)) : value
    },
    number(node) {
      const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number()' : 'z.number()'

      return `${base}${dialect.numbers(node)}`
    },
    integer(node) {
      if (shouldCoerce(this.options.coercion, 'numbers')) return `${dialect.coercedInt}${dialect.numbers(node)}`
      if (node.format === 'int32') return `z.int32()${dialect.numbers(node)}`
      if (node.format === 'uint32') return `z.uint32()${dialect.numbers(node)}`

      return `z.int()${dialect.numbers(node)}`
    },
    uuid(node) {
      const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'

      return `${base}${dialect.lengths({ ...node, regexType: this.options.regexType })}`
    },
    email(node) {
      return `z.email()${dialect.lengths({ ...node, regexType: this.options.regexType })}`
    },
    url(node) {
      return `z.url()${dialect.lengths({ ...node, regexType: this.options.regexType })}`
    },
    ipv4: () => 'z.ipv4()',
    ipv6: () => 'z.ipv6()',
    blob: () => 'z.instanceof(Blob)',
    enum(node) {
      const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []
      const nonNullValues = values.filter((v): v is string | number | boolean => v !== null)

      // asConst-style enum: use z.union([z.literal(…), …])
      if (node.namedEnumValues?.length) {
        const literals = nonNullValues.map((v) => buildLiteral(v))

        if (literals.length === 1) return literals[0]!
        return `z.union([${literals.join(', ')}])`
      }

      // Regular enum: z.enum for all-string sets, z.literal/z.union otherwise
      return buildEnum(nonNullValues)
    },
  }
}

/**
 * Builds the node handlers of one Zod printer instance from its dialect: the shared scalars plus
 * the `ref` and container handlers.
 *
 * `cyclicSchemas` is captured once because the object handler clears `options.cyclicSchemas` while
 * it renders a getter body, and the `.strict()` and discriminability decisions must still see it.
 */
export function buildZodNodes<TOptions extends ZodNodeOptions>(
  dialect: ZodDialect<TOptions>,
  cyclicSchemas: ReadonlySet<string> | undefined,
): ast.PrinterPartial<string, TOptions> {
  const unionsWithSiblings = new WeakSet<ast.SchemaNode>()
  // An OpenAPI 3.0 `nullable: true` set on an array item or union member itself, which only a property or a root applies.
  const printNullable = (schema: ast.SchemaNode, output: string | null | undefined) => (output && schema.nullable ? dialect.nullable(output) : output)

  return {
    ...buildScalarNodes(dialect),
    ref(node) {
      if (!node.name) return null
      const refName = ast.resolveRefName(node)
      if (!refName) return null

      // In the input direction, a component whose fields print differently by direction resolves
      // to its `${name}InputSchema` variant so request bodies encode instead of decoding.
      const useInputVariant = node.ref != null && (dialect.useInputVariant?.(node, this.options) ?? false)
      const resolvedName = node.ref
        ? useInputVariant
          ? (this.options.resolver?.schema.inputName(refName) ?? refName)
          : (this.options.resolver?.name(refName) ?? refName)
        : node.name

      if (node.ref && this.options.cyclicSchemas?.has(refName)) {
        return `z.lazy(() => ${resolvedName})`
      }

      return resolvedName
    },
    object(node) {
      const entries = node.properties ?? []
      const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []
      const propertyNamesNode = node.propertyNames
      const propertyNamesKeySchema = propertyNamesNode ? this.transform(propertyNamesNode) : null

      // `additionalProperties: false` still permits patternProperties keys, so only a pattern-free object is strict.
      // `z.strictObject(...)` rather than `z.object(...).strict()`: `.strict()` reads `.shape` eagerly, which runs a
      // self-reference's deferred getter while its own `const` is still in the temporal dead zone.
      const isStrict = node.additionalProperties === false && patterns.length === 0
      const isLoose = node.additionalProperties === true
      const ctor = isStrict ? 'z.strictObject' : isLoose ? 'z.looseObject' : 'z.object'
      const shape = dialect.objectShape(this, node)
      const objectBase = `${ctor}(${shape})`

      const result = (() => {
        // Closed key schemas (enums, literals) use z.partialRecord() so missing keys do not fail exhaustiveness.
        const recordFn = isClosedKeySchema(propertyNamesNode) ? 'z.partialRecord' : 'z.record'

        if (node.additionalProperties && node.additionalProperties !== true) {
          const catchallType = this.transform(node.additionalProperties)
          if (entries.length === 0) {
            return catchallType ? `${recordFn}(${propertyNamesKeySchema || 'z.string()'}, ${catchallType})` : objectBase
          }
          return catchallType ? dialect.catchall(objectBase, catchallType) : objectBase
        }
        if (entries.length === 0 && patterns.length === 0 && propertyNamesKeySchema && !isStrict) {
          const unknownType = this.transform(ast.factory.createSchema({ type: ast.schemaTypes.unknown }))!
          return `${recordFn}(${propertyNamesKeySchema}, ${unknownType})`
        }
        if (node.additionalProperties === true) return objectBase
        if (isStrict) return objectBase

        // No fixed properties: z.record enforces the key pattern. With fixed properties a record would
        // reject the declared keys, so fall back to a catchall (value validated, key pattern not).
        if (patterns.length > 0) {
          const values = patterns.map(([, valueSchema]) => {
            const valueType = this.transform(valueSchema) ?? this.transform(ast.factory.createSchema({ type: ast.schemaTypes.unknown }))!
            return valueSchema.nullable ? dialect.nullable(valueType) : valueType
          })
          const distinct = [...new Set(values)]
          const value = distinct.length === 1 ? distinct[0]! : `z.union([${distinct.join(', ')}])`

          if (entries.length > 0) return dialect.catchall(objectBase, value)
          return `z.record(${dialect.patternKey({ patterns: patterns.map(([pattern]) => pattern), regexType: this.options.regexType })}, ${value})`
        }

        return objectBase
      })()

      return objectConstraints({ value: result, node })
    },
    array(node) {
      const items = mapSchemaItems(node, (item) => printNullable(item, this.transform(item)))
        .map(({ output }) => output)
        .filter(Boolean)
      const inner = items.join(', ') || this.transform(ast.factory.createSchema({ type: ast.schemaTypes.unknown }))!
      const base = `z.array(${inner})${dialect.lengths({ ...node, regexType: this.options.regexType })}`

      return node.unique ? dialect.unique(base) : base
    },
    tuple(node) {
      const items = mapSchemaItems(node, (item) => printNullable(item, this.transform(item)))
        .map(({ output }) => output)
        .filter(Boolean)

      // OpenAPI 3.1 `items` next to `prefixItems` types the elements after the positional ones.
      const rest = node.rest ? this.transform(node.rest) : undefined

      return `z.tuple(${buildList(items)}${rest ? `, ${rest}` : ''})`
    },
    union(node) {
      const literalUnion = getLiteralUnion({ node, options: this.options })
      if (literalUnion) {
        const schema = buildEnum(literalUnion.values)
        return literalUnion.coerce ? dialect.coercedNumber(schema) : schema
      }

      const nodeMembers = node.members ?? []
      const { discriminatorPropertyName } = node
      // z.discriminatedUnion needs every option to be a Zod object. Object variants (refs or
      // extend-composed `allOf`) qualify; intersections, cyclic `z.lazy(…)` refs, and
      // non-objects fall back to z.union. A coerced discriminator hides its values behind
      // `z.coerce.number()`, which z.discriminatedUnion cannot read, so it falls back too.
      const isDiscriminated =
        !!discriminatorPropertyName &&
        nodeMembers.every((m) => isObjectSchemaNode(m, cyclicSchemas) && !hasPlainDiscriminator({ member: m, propertyName: discriminatorPropertyName })) &&
        !nodeMembers.some((m) => hasCoercedDiscriminator({ member: m, propertyName: discriminatorPropertyName, options: this.options }))
      const isXor = node.strategy === 'one' && !isDiscriminated && this.options.oneOfType === 'xor'
      // `z.xor` already rejects a value matching several members, and the discriminator already picks one
      // member of a `z.discriminatedUnion`, so their members stay as declared.
      const isStrict = node.strategy === 'one' && !isXor && !isDiscriminated && !unionsWithSiblings.has(node)
      const members = mapSchemaMembers(node, (memberNode) => this.transform(isStrict ? strictOneOfNode(memberNode) : memberNode))
        .map(({ schema, output }) => (output && isStrict && dialect.strictMember ? dialect.strictMember(output, schema, cyclicSchemas) : output))
        .map((output, index) => (isDiscriminated ? output : printNullable(nodeMembers[index]!, output)))
        .filter(Boolean)
      if (members.length === 0) return ''
      if (members.length === 1) return members[0]!
      if (isDiscriminated) {
        return `z.discriminatedUnion(${stringify(node.discriminatorPropertyName)}, ${buildList(members)})`
      }
      if (isXor) return `z.xor(${buildList(members)})`

      return `z.union(${buildList(members)})`
    },
    intersection(node) {
      const members = node.members ?? []
      if (members.length === 0) return ''
      const hasSiblingProperties = members.some((member) => member.type === ast.schemaTypes.object && member.properties.length > 0)
      const transform = (member: ast.SchemaNode) => {
        if (!hasSiblingProperties) return this.transform(member)
        unionsWithSiblings.add(member)
        try {
          return this.transform(member)
        } finally {
          unionsWithSiblings.delete(member)
        }
      }

      const [first, ...rest] = members
      if (!first) return ''

      const firstBase = transform(first)
      if (!firstBase) return ''

      // An object `allOf` is a merge, not a runtime intersection: extending keeps it a Zod object
      // (usable in z.discriminatedUnion) instead of a non-discriminable intersection.
      if (rest.length > 0 && isObjectComposableIntersection(node, cyclicSchemas)) {
        // A discriminated `oneOf` base already pins its discriminator to a literal; a sibling
        // `type: string` extended after it would widen that literal back to any string.
        const discriminator = ast.narrowSchema(first, ast.schemaTypes.union)?.discriminatorPropertyName
        return preserveRequiredProperties(members)
          .slice(1)
          .reduce((acc, member) => {
            const object = ast.narrowSchema(member, ast.schemaTypes.object)
            if (!discriminator || !object?.properties.some((property) => property.name === discriminator)) {
              return dialect.extend(acc, dialect.objectShape(this, member))
            }
            const properties = object.properties.filter((property) => property.name !== discriminator)
            return properties.length ? dialect.extend(acc, dialect.objectShape(this, { ...object, properties })) : acc
          }, firstBase)
      }

      return rest.reduce((acc, member) => {
        const constraint = getMemberConstraint({ member, regexType: this.options.regexType, lengths: dialect.lengths, numbers: dialect.numbers })
        if (constraint) return acc + constraint
        const transformed = transform(member)
        return transformed ? dialect.intersection(acc, transformed) : acc
      }, firstBase)
    },
  }
}
