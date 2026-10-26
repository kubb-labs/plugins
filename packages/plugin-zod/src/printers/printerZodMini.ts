import { mapSchemaItems, mapSchemaMembers } from '@internals/shared'
import { buildList, lazyGetter, objectKey, stringify } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import {
  applyMiniModifiers,
  buildEnum,
  buildLiteral,
  buildObjectShape,
  getMemberConstraint,
  integerFormatPattern,
  isClosedKeySchema,
  isObjectComposableIntersection,
  isObjectSchemaNode,
  lengthChecksMini,
  numberChecksMini,
  objectConstraints,
  patternKeySchemaMini,
  preserveRequiredProperties,
  printWithOmit,
  shouldCoerce,
  strictOneOfNode,
  STRING_FORMAT_CALLS,
} from '../utils.ts'

/**
 * Partial map of node-type overrides for the Zod Mini printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`). The function
 * replaces the built-in handler for that node type. Use `this.transform` to
 * recurse into nested schema nodes, `this.base` to reuse the output of the
 * handler being replaced, and `this.options` to read printer options.
 *
 * @example Override the `date` handler
 * ```ts
 * pluginZod({
 *   mini: true,
 *   printer: {
 *     nodes: {
 *       date(node) {
 *         return 'z.iso.date()'
 *       },
 *     },
 *   },
 * })
 * ```
 */
export type PrinterZodMiniNodes = ast.PrinterPartial<string, PrinterZodMiniOptions>

export type PrinterZodMiniOptions = {
  /**
   * Enable automatic type coercion for strings, numbers, and dates through `z.coerce.*()`.
   */
  coercion?: PluginZod['resolvedOptions']['coercion']
  /**
   * Use `z.guid()` or `z.uuid()` for UUID/GUID validation.
   *
   * @default 'uuid'
   */
  guidType?: PluginZod['resolvedOptions']['guidType']
  /**
   * Output form for an OpenAPI `pattern` inside `z.regex(...)`: a regex literal
   * (`'literal'`) or the `RegExp` constructor (`'constructor'`).
   *
   * @default 'literal'
   */
  regexType?: PluginZod['resolvedOptions']['regexType']
  /**
   * How a non-discriminated `oneOf` is printed: `z.union` with strict members or `z.xor`.
   *
   * @default 'union'
   */
  oneOfType?: PluginZod['resolvedOptions']['oneOfType']
  /**
   * Transforms raw schema names into valid JavaScript identifiers.
   */
  resolver?: ResolverZod
  /**
   * Properties to exclude using `.omit({ key: true })`.
   */
  keysToOmit?: Array<string> | null
  /**
   * Schema names that form circular dependency chains.
   * Properties referencing these emit lazy getters wrapping refs in `z.lazy(() => …)`.
   */
  cyclicSchemas?: ReadonlySet<string>
  /**
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterZodMiniNodes
}

/**
 * Factory options for the Zod Mini printer, defining input/output types and configuration.
 */
export type PrinterZodMiniFactory = ast.PrinterFactoryOptions<'zod-mini', PrinterZodMiniOptions, string, string>

/**
 * Builds the `{ key: value, … }` shape for an object node with the functional `zod/mini` modifiers.
 */
function buildZodMiniObjectShape(ctx: Parameters<typeof buildObjectShape>[0], node: ast.SchemaNode): string {
  return buildObjectShape(ctx, node, ({ name, value, schema, required, meta, cyclic }) => {
    const body = applyMiniModifiers({
      value,
      schema,
      nullable: meta.nullable,
      optional: schema.optional || required === false,
      nullish: schema.nullish,
      defaultValue: meta.default,
    })
    return cyclic ? lazyGetter({ name, body }) : `${objectKey(name)}: ${body}`
  })
}

/**
 * Zod v4 Mini printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST into a Zod v4 code string using the functional API
 * (`z.optional(z.string())`) for improved tree-shaking. See {@link printerZod} for the chainable API.
 *
 * @example Functional Mini API
 * ```ts
 * const printer = printerZodMini({})
 * const code = printer.print(optionalStringNode) // "z.optional(z.string())"
 * ```
 */
export const printerZodMini = ast.createPrinter<PrinterZodMiniFactory>((options) => {
  // The object handler temporarily clears `options.cyclicSchemas` while rendering a getter body, so
  // capture a stable reference for the intersection/union discriminability decisions.
  const cyclicSchemaNames = options.cyclicSchemas
  const unionsWithSiblings = new WeakSet<ast.SchemaNode>()
  return {
    name: 'zod-mini',
    options,
    nodes: {
      any: () => 'z.any()',
      unknown: () => 'z.unknown()',
      void: () => 'z.void()',
      never: () => 'z.never()',
      boolean: () => 'z.boolean()',
      null: () => 'z.null()',
      string(node) {
        const coerce = shouldCoerce(this.options.coercion, 'strings')

        const call = coerce ? undefined : STRING_FORMAT_CALLS.get(node.format)
        if (call) return `${call}${lengthChecksMini({ ...node, regexType: this.options.regexType })}`

        const base = coerce ? 'z.coerce.string()' : 'z.string()'
        const pattern = node.pattern ?? integerFormatPattern(node.format)

        return `${base}${lengthChecksMini({ ...node, pattern, regexType: this.options.regexType })}`
      },
      number(node) {
        const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number()' : 'z.number()'

        return `${base}${numberChecksMini(node)}`
      },
      integer(node) {
        if (shouldCoerce(this.options.coercion, 'numbers')) {
          return `z.coerce.number().check(z.int())${numberChecksMini(node)}`
        }
        if (node.format === 'int32') {
          return `z.int32()${numberChecksMini(node)}`
        }
        if (node.format === 'uint32') {
          return `z.uint32()${numberChecksMini(node)}`
        }

        return `z.int()${numberChecksMini(node)}`
      },
      bigint(node) {
        return `z.coerce.bigint()${numberChecksMini(node)}`
      },
      date(node) {
        if (node.representation === 'string') {
          return 'z.iso.date()'
        }

        return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : 'z.date()'
      },
      datetime() {
        // Mini mode: datetime validation via z.string() (z.iso.datetime not available in mini)
        return 'z.string()'
      },
      time(node) {
        if (node.representation === 'string') {
          return 'z.iso.time()'
        }

        return 'z.date()'
      },
      uuid(node) {
        const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'

        return `${base}${lengthChecksMini({ ...node, regexType: this.options.regexType })}`
      },
      email(node) {
        return `z.email()${lengthChecksMini({ ...node, regexType: this.options.regexType })}`
      },
      url(node) {
        return `z.url()${lengthChecksMini({ ...node, regexType: this.options.regexType })}`
      },
      ipv4: () => 'z.ipv4()',
      ipv6: () => 'z.ipv6()',
      blob: () => 'z.instanceof(File)',
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

      ref(node) {
        if (!node.name) return null
        const refName = ast.resolveRefName(node)
        if (!refName) return null
        const resolvedName = node.ref ? (this.options.resolver?.name(refName) ?? refName) : node.name

        if (node.ref && this.options.cyclicSchemas?.has(refName)) {
          return `z.lazy(() => ${resolvedName})`
        }

        return resolvedName
      },
      object(node) {
        const entries = node.properties ?? []
        // zod/mini has no chainable `.catchall()`/`.strict()`, so route through the functional forms.
        const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []
        const propertyNamesNode = node.propertyNames
        const propertyNamesKeySchema = propertyNamesNode ? this.transform(propertyNamesNode) : null

        // `additionalProperties: false` still permits patternProperties keys, so only a pattern-free object is strict.
        const isStrict = node.additionalProperties === false && patterns.length === 0
        const isLoose = node.additionalProperties === true
        const ctor = isStrict ? 'z.strictObject' : isLoose ? 'z.looseObject' : 'z.object'
        const shape = buildZodMiniObjectShape(this, node)
        const objectBase = `${ctor}(${shape})`

        const result = (() => {
          // Closed key schemas (enums, literals) use z.partialRecord() so missing keys do not fail exhaustiveness.
          const recordFn = isClosedKeySchema(propertyNamesNode) ? 'z.partialRecord' : 'z.record'

          if (node.additionalProperties && node.additionalProperties !== true) {
            const catchallType = this.transform(node.additionalProperties)
            if (entries.length === 0) {
              return catchallType ? `${recordFn}(${propertyNamesKeySchema || 'z.string()'}, ${catchallType})` : objectBase
            }
            return catchallType ? `z.catchall(${objectBase}, ${catchallType})` : objectBase
          }
          if (entries.length === 0 && patterns.length === 0 && propertyNamesKeySchema && !isStrict) {
            const unknownType = this.transform(ast.factory.createSchema({ type: ast.schemaTypes.unknown }))!
            return `${recordFn}(${propertyNamesKeySchema}, ${unknownType})`
          }
          if (node.additionalProperties === true) return objectBase
          if (isStrict) return objectBase

          if (patterns.length > 0) {
            const values = patterns.map(([, valueSchema]) => {
              const valueType = this.transform(valueSchema) ?? this.transform(ast.factory.createSchema({ type: ast.schemaTypes.unknown }))!
              return valueSchema.nullable ? `z.nullable(${valueType})` : valueType
            })
            const distinct = [...new Set(values)]
            const value = distinct.length === 1 ? distinct[0]! : `z.union([${distinct.join(', ')}])`

            if (entries.length > 0) return `z.catchall(${objectBase}, ${value})`
            return `z.record(${patternKeySchemaMini({ patterns: patterns.map(([pattern]) => pattern), regexType: this.options.regexType })}, ${value})`
          }

          return objectBase
        })()

        return objectConstraints({ value: result, node })
      },
      array(node) {
        const items = mapSchemaItems(node, (item) => this.transform(item))
          .map(({ output }) => output)
          .filter(Boolean)
        const inner = items.join(', ') || this.transform(ast.factory.createSchema({ type: ast.schemaTypes.unknown }))!
        const base = `z.array(${inner})${lengthChecksMini({ ...node, regexType: this.options.regexType })}`

        return node.unique ? `${base}.check(z.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" }))` : base
      },
      tuple(node) {
        const items = mapSchemaItems(node, (item) => this.transform(item))
          .map(({ output }) => output)
          .filter(Boolean)

        return `z.tuple(${buildList(items)})`
      },
      union(node) {
        const nodeMembers = node.members ?? []
        // z.discriminatedUnion needs every option to be a Zod object. Object variants (refs or
        // `z.extend(…)`-composed `allOf`) qualify; intersections, cyclic `z.lazy(…)` refs, and
        // non-objects fall back to z.union.
        const isDiscriminated = !!node.discriminatorPropertyName && nodeMembers.every((m) => isObjectSchemaNode(m, cyclicSchemaNames))
        const isXor = node.strategy === 'one' && !isDiscriminated && this.options.oneOfType === 'xor'
        // `z.xor` already rejects a value matching several members, so its members stay as declared.
        const isStrict = node.strategy === 'one' && !isXor && !unionsWithSiblings.has(node)
        const members = mapSchemaMembers(node, (memberNode) => this.transform(isStrict ? strictOneOfNode(memberNode) : memberNode))
          .map(({ output }) => output)
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

        // An object `allOf` is a merge, not a runtime intersection: `z.extend(base, { … })` keeps it
        // a Zod object (usable in z.discriminatedUnion) instead of a non-discriminable `z.intersection`.
        if (rest.length > 0 && isObjectComposableIntersection(node, cyclicSchemaNames)) {
          return preserveRequiredProperties(members)
            .slice(1)
            .reduce((acc, member) => `z.extend(${acc}, ${buildZodMiniObjectShape(this, member)})`, firstBase)
        }

        return rest.reduce((acc, member) => {
          const constraint = getMemberConstraint({ member, regexType: this.options.regexType, lengths: lengthChecksMini, numbers: numberChecksMini })
          if (constraint) return acc + constraint
          const transformed = transform(member)
          return transformed ? `z.intersection(${acc}, ${transformed})` : acc
        }, firstBase)
      },
    },
    overrides: options.nodes,
    print(node) {
      return printWithOmit(
        this,
        node,
        (value, meta) =>
          applyMiniModifiers({ value, schema: node, nullable: meta.nullable, optional: meta.optional, nullish: meta.nullish, defaultValue: meta.default }),
        true,
      )
    },
  }
})
