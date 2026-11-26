import { ast } from '@internals/ast'
import {
  collectDirectionalRefNames as collectDirectionalRefs,
  containsDirectionalNode as containsDirectional,
  getChecks,
  getObjectKind,
  isComposedObject,
  integerFormatPattern,
  preserveRequiredProperties,
  shouldCoerce,
  strictOneOfNode,
  variesByDirection as probeDirection,
  withFormatRange,
} from '@internals/shared'
import { buildList, buildObject } from '@internals/utils'
import { createPrinter, text } from '@kubb/kit'
import {
  applyModifiers,
  buildEnum,
  containsCheck,
  hasChecks,
  hasMetadata,
  inputChecks,
  lengthActions,
  type LengthConstraints,
  memberActions,
  notCheck,
  numberActions,
  objectEntries,
  pipe,
  type ValibotPrinterContext,
  strictMember,
  stringFormatActions,
  UNKNOWN,
  unwrapChain,
  withInputChecks,
} from '../utils.ts'
import type { PluginValibot, ResolverValibot } from '../types.ts'
import type { Direction } from '@internals/shared/types'

/**
 * Partial map of node-type overrides for the Valibot printer, keyed by `SchemaType`. Each function
 * replaces the built-in handler and can call `this.transform`, `this.base`, and `this.options`.
 */
export type PrinterValibotNodes = ast.PrinterPartial<string, PrinterValibotOptions>

export type PrinterValibotOptions = {
  /**
   * Output form for an OpenAPI `pattern` inside `v.regex(...)`.
   *
   * @default 'literal'
   */
  regexType?: PluginValibot['resolvedOptions']['regexType']
  /**
   * How a `oneOf` without a discriminator is validated: strict members, or exactly one match.
   *
   * @default 'union'
   */
  oneOfType?: PluginValibot['resolvedOptions']['oneOfType']
  /**
   * Convert input before validation: `v.toString()`, `v.toNumber()`, and `v.toDate()`.
   *
   * @default false
   */
  coercion?: PluginValibot['resolvedOptions']['coercion']
  /**
   * Which way a node converts between its wire type and its runtime type:
   * - `'decode'` (default): wire into runtime, used by response schemas.
   * - `'encode'`: runtime back to wire, used by request bodies and parameters.
   *
   * A handler that returns different output per direction makes the generator emit an
   * `${name}InputSchema` variant for that component.
   */
  direction?: Direction
  /**
   * Turns a schema name from the spec into the name of its generated const.
   */
  resolver?: ResolverValibot
  /**
   * Caches the directional-node lookups of `containsDirectionalNode`. The `setPrinter` factory creates
   * one per printer, so the cache lives as long as that printer. Without it, nothing is cached.
   */
  directionalCache?: WeakMap<ast.SchemaNode, ast.SchemaNode | null>
  /**
   * Property names to drop from the printed object with `v.omit(...)`.
   */
  keysToOmit?: Array<string> | null
  /**
   * Schema names that are part of a circular reference. A `$ref` to one of them prints inside
   * `v.lazy(() => ...)`.
   */
  cyclicSchemas?: ReadonlySet<string>
  /**
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterValibotNodes
}

/**
 * Factory options for the Valibot printer: its name, options, and output types.
 */
export type PrinterValibotFactory = ast.PrinterFactoryOptions<'valibot', PrinterValibotOptions, string, string>

/**
 * The handlers that print differently per direction. `date` and `time` decode a wire string into a
 * `Date` on responses and encode it back on requests. Only `representation: 'date'` fields convert.
 * `time` has no date part, so it decodes onto `1970-01-01` and encodes back to `HH:mm:ssZ`, with milliseconds when it has them.
 */
const directionalNodes: PrinterValibotNodes = {
  date(node) {
    if (node.representation !== 'date') return 'v.pipe(v.string(), v.isoDate())'
    if (this.options.direction === 'encode') {
      return node.format === 'date'
        ? 'v.pipe(v.date(), v.transform((value) => value.toISOString().slice(0, 10)))'
        : 'v.pipe(v.date(), v.transform((value) => value.toISOString()))'
    }
    if (shouldCoerce(this.options.coercion, 'dates')) return 'v.pipe(v.unknown(), v.toDate())'

    return node.format === 'date'
      ? 'v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value)))'
      : 'v.pipe(v.string(), v.isoTimestamp(), v.transform((value) => new Date(value)))'
  },
  time(node) {
    // Valibot's time actions reject fractional seconds, which an OpenAPI `time` allows, so a time string stays unchecked.
    if (node.representation === 'string') return 'v.string()'
    // An OpenAPI `time` is an RFC 3339 full-time: it ends in `Z` or an offset, and can carry milliseconds.
    if (this.options.direction === 'encode') return 'v.pipe(v.date(), v.transform((value) => value.toISOString().slice(11).replace(".000Z", "Z")))'

    // A time without an offset is read as UTC. The trailing `v.date()` rejects the Invalid Date a malformed time turns into.
    return 'v.pipe(v.string(), v.transform((value) => new Date(`1970-01-01T${value}${/(?:z|[+-]\\d{2}:\\d{2})$/i.test(value) ? "" : "Z"}`)), v.date())'
  },
}

// Whether the handler of a node, a `printer.nodes` override or else the built-in, prints differently per direction.
const varies = (printerOptions: PrinterValibotOptions) => (node: ast.SchemaNode) =>
  probeDirection({ node, handler: printerOptions.nodes?.[node.type] ?? directionalNodes[node.type], options: printerOptions })

/**
 * Whether the schema contains a node that prints differently per direction, so it decodes on
 * responses and encodes on requests. Follows a `$ref` through its resolved schema.
 */
export function containsDirectionalNode({ node, printerOptions }: { node: ast.SchemaNode | undefined; printerOptions: PrinterValibotOptions }): boolean {
  return containsDirectional({ node, varies: varies(printerOptions), cache: printerOptions.directionalCache })
}

/**
 * Names of the `$ref` schemas a request schema reads from their `${name}InputSchema` variant.
 */
export function collectDirectionalRefNames({ node, printerOptions }: { node: ast.SchemaNode; printerOptions: PrinterValibotOptions }): Array<string> {
  return collectDirectionalRefs({ node, contains: (ref) => containsDirectionalNode({ node: ref, printerOptions }) })
}

/**
 * Valibot v1 printer. Turns a `SchemaNode` into the code of a Valibot schema.
 *
 * @example
 * ```ts
 * const printer = printerValibot({})
 *
 * printer.print(ast.factory.createSchema({ type: 'string', min: 1 })) // 'v.pipe(v.string(), v.minLength(1))'
 * ```
 */
export const printerValibot = createPrinter<PrinterValibotFactory>((options) => {
  // Read once: `getObjectKind` and `strictMember` need the full set for every node.
  const { cyclicSchemas } = options
  // A const whose schema carries a `default` is a `v.optional(...)` wrapper, which has no `.entries`.
  const isObjectNode = (node: ast.SchemaNode) => {
    const resolved = ast.ref.mergeSchema(node)
    const kind = getObjectKind(node, { circularSchemas: cyclicSchemas })
    return kind !== null && kind !== 'record' && resolved.default === undefined && !getChecks(resolved).some((check) => check.kind === 'patternProperties')
  }
  // The node `print` reads without its input checks, because `v.omit` needs the bare object. Nested nodes keep theirs.
  let uncheckedNode: ast.SchemaNode | null = null
  // An OpenAPI 3.0 `nullable: true` set on an array item or union member, which only a property or a root applies.
  const printNullable = (schema: ast.SchemaNode, output: string | null) => (output && schema.nullable ? `v.nullable(${output})` : output)
  const formatString = (action: string, node: LengthConstraints) => pipe('v.string()', [action, ...lengthActions(node, options.regexType)])

  // Whether an `allOf` prints as one `v.object` with the entries of every member, and not as `v.intersect`.
  const mergesToObject = (node: ast.SchemaNode): boolean => {
    const [first, ...rest] = ast.schema.narrow(node, ast.schema.types.intersection)?.members ?? []
    if (!first || rest.length === 0) return false
    const baseObject = ast.schema.narrow(ast.ref.mergeSchema(first), ast.schema.types.object)
    // A rest schema or a key pattern cannot move into the merged object, so that base stays in `v.intersect`.
    const hasRest =
      Boolean(baseObject?.patternProperties) || (baseObject?.additionalProperties !== undefined && typeof baseObject.additionalProperties !== 'boolean')

    return !hasRest && isObjectNode(first) && isComposedObject(node, { circularSchemas: cyclicSchemas })
  }
  // Whether the schema prints with `.entries`, which `v.omit` reads. A `v.union` and a `v.intersect` have none.
  const printsEntries = (node: ast.SchemaNode): boolean => {
    const ref = ast.schema.narrow(node, ast.schema.types.ref)
    if (ref?.schema && ref.schema !== ref) return printsEntries(ref.schema)
    // An unresolved ref has no schema to read, so it counts as an object, as it does for `v.variant`.
    if (ref) return true

    return node.type === ast.schema.types.object ? node.properties.length > 0 : mergesToObject(node)
  }

  // Prints the schema without `keysToOmit`. `v.omit` takes a bare object schema, so each wrapper is peeled off first.
  function omitKeys(
    this: ValibotPrinterContext,
    { node, transformed, keysToOmit }: { node: ast.SchemaNode; transformed: string; keysToOmit: Array<string> },
  ): string {
    const target = ast.schema.narrow(node, 'ref')?.schema ?? node
    const keys = `[${keysToOmit.map((key) => text.quote(key)).join(', ')}]`

    // A circular const is typed `v.GenericSchema`, which `v.omit` does not take. The generator prints that object inline.
    if (transformed.startsWith('v.lazy(')) return transformed
    const base = `${transformed}${unwrapChain(node, this.options.direction)}`
    if (!hasChecks(target)) return `v.omit(${base}, ${keys})`
    // `withInputChecks` printed `v.pipe(v.unknown(), ...checks, object)`. `v.omit` takes the object only, so the checks go back around it.
    if (node.type === ast.schema.types.ref) {
      const count = getChecks(target).length
      const checks = Array.from({ length: count }, (_, index) => `${base}.pipe[${index + 1}]`)

      return pipe(UNKNOWN, [...checks, `v.omit(${base}.pipe[${count + 1}], ${keys})`])
    }

    uncheckedNode = node
    try {
      return pipe(UNKNOWN, [...inputChecks(this, node), `v.omit(${this.transform(node)}, ${keys})`])
    } finally {
      uncheckedNode = null
    }
  }

  const nodes: PrinterValibotNodes = {
    any: () => 'v.any()',
    unknown: () => UNKNOWN,
    void: () => 'v.void()',
    never: () => 'v.never()',
    boolean: () => 'v.boolean()',
    null: () => 'v.null()',
    blob: () => 'v.blob()',
    ipv4: () => 'v.pipe(v.string(), v.ipv4())',
    ipv6: () => 'v.pipe(v.string(), v.ipv6())',
    string(node) {
      const coerce = shouldCoerce(this.options.coercion, 'strings')
      const format = stringFormatActions.get(node.format) ?? (node.content?.encoding?.toLowerCase() === 'base64' ? 'v.base64()' : undefined)
      const pattern = node.pattern ?? integerFormatPattern(node.format)
      const actions = [coerce && 'v.toString()', format, ...lengthActions({ ...node, pattern }, this.options.regexType)]

      const contentNode = ast.schema.getEmbeddedJson(node)
      if (!contentNode) return pipe(coerce ? UNKNOWN : 'v.string()', actions)
      // The string holds wire JSON whichever way the string itself travels, so its schema always decodes.
      const { direction } = this.options
      this.options.direction = 'decode'
      let content: string | null
      try {
        content = this.transform(contentNode)
      } finally {
        this.options.direction = direction
      }

      return pipe(coerce ? UNKNOWN : 'v.string()', [
        ...actions,
        content &&
          `v.check((value) => { try { return v.is(${content}, JSON.parse(value)) } catch { return false } }, "String must hold JSON that matches its content schema")`,
      ])
    },
    uuid: (node) => formatString('v.uuid()', node),
    email: (node) => formatString('v.email()', node),
    url: (node) => formatString('v.url()', node),
    number(node) {
      const coerce = shouldCoerce(this.options.coercion, 'numbers')

      return pipe(coerce ? UNKNOWN : 'v.number()', [coerce && 'v.toNumber()', ...numberActions(node)])
    },
    integer(node) {
      const coerce = shouldCoerce(this.options.coercion, 'numbers')

      return pipe(coerce ? UNKNOWN : 'v.number()', [coerce && 'v.toNumber()', 'v.integer()', ...numberActions(withFormatRange(node, 'integer'))])
    },
    bigint(node) {
      // JSON carries a 64-bit integer as a number or a string, so both convert.
      return pipe('v.union([v.bigint(), v.number(), v.string()])', [
        'v.toBigint()',
        ...numberActions(withFormatRange({ ...ast.schema.getNumberBounds(node), format: node.format }, 'bigint'), true),
      ])
    },
    ...directionalNodes,
    datetime(node) {
      // `v.isoTimestamp()` needs a `Z` or an offset, so a local date-time stays an unchecked string.
      const isLocal = node.local

      return isLocal ? 'v.string()' : 'v.pipe(v.string(), v.isoTimestamp())'
    },
    enum(node) {
      return buildEnum(ast.schema.getLiterals(node).filter((value) => value !== null))
    },
    ref(node) {
      if (!node.name) return null
      const refName = ast.ref.getName(node)
      if (!refName) return null
      // A request schema reads a component with a direction-dependent field from its `${name}InputSchema` variant.
      const useInputVariant = node.ref != null && this.options.direction === 'encode' && containsDirectionalNode({ node, printerOptions: this.options })
      const resolver = this.options.resolver
      const resolvedName = node.ref ? ((useInputVariant ? resolver?.schema.inputName(refName) : resolver?.name(refName)) ?? refName) : node.name

      return node.ref && cyclicSchemas?.has(refName) ? `v.lazy(() => ${resolvedName})` : resolvedName
    },
    object(node) {
      const hasProperties = node.properties.length > 0
      const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []
      const shape = buildObject(objectEntries(this, node.properties))
      const keySchema = node.propertyNames ? this.transform(node.propertyNames) : null
      // `additionalProperties: false` still permits patternProperties keys, so only a pattern-free object is strict.
      const isStrict = node.additionalProperties === false && patterns.length === 0

      if (node.additionalProperties && node.additionalProperties !== true) {
        const rest = this.transform(node.additionalProperties)
        if (rest) return hasProperties ? `v.objectWithRest(${shape}, ${rest})` : `v.record(${keySchema ?? 'v.string()'}, ${rest})`
      }
      if (isStrict) return `v.strictObject(${shape})`
      if (!hasProperties && patterns.length === 0 && keySchema) return `v.record(${keySchema}, ${UNKNOWN})`
      if (node.additionalProperties === true) return `v.looseObject(${shape})`

      if (patterns.length > 0) {
        const values = [...new Set(patterns.map(([, schema]) => printNullable(schema, this.transform(schema) ?? UNKNOWN)!))]
        const value = values.length === 1 ? values[0]! : `v.union(${buildList(values)})`
        // With fixed properties a record would reject the declared keys, so the rest schema checks the value only.
        if (hasProperties) return `v.objectWithRest(${shape}, ${value})`
        const keyPattern = patterns.length === 1 ? patterns[0]![0] : patterns.map(([pattern]) => `(${pattern})`).join('|')

        return `v.record(${pipe('v.string()', lengthActions({ pattern: keyPattern }, this.options.regexType))}, ${value})`
      }

      return `v.object(${shape})`
    },
    array(node) {
      const items = (node.items ?? []).map((item) => printNullable(item, this.transform(item))).filter((item): item is string => Boolean(item))
      const inner = items.length > 1 ? `v.union(${buildList(items)})` : (items[0] ?? UNKNOWN)

      return pipe(`v.array(${inner})`, [
        ...lengthActions({ min: node.min, max: node.max }, this.options.regexType),
        node.unique && 'v.check((items) => new Set(items).size === items.length, "Array entries must be unique")',
        node.contains && containsCheck(this, node.contains),
      ])
    },
    tuple(node) {
      const items = buildList((node.items ?? []).map((item) => printNullable(item, this.transform(item))).filter((item): item is string => Boolean(item)))
      // OpenAPI 3.1 `items` next to `prefixItems` types the elements after the positional ones.
      const rest = node.rest ? this.transform(node.rest) : null

      return pipe(rest ? `v.tupleWithRest(${items}, ${rest})` : `v.tuple(${items})`, [node.contains && containsCheck(this, node.contains)])
    },
    union(node) {
      const nodeMembers = node.members ?? []
      const { discriminatorPropertyName } = node
      // `v.variant` takes object schemas only. Intersections, wrapped objects, and `v.lazy` refs fall back to `v.union`.
      const isDiscriminated = !!discriminatorPropertyName && nodeMembers.every(isObjectNode)
      // `v.union` returns the first member that matches, and an object member drops the keys it does not
      // know. A strict member rejects those keys instead, so a `oneOf` value reaches the member it belongs to.
      const isXor = node.strategy === 'one' && !isDiscriminated && this.options.oneOfType === 'xor'
      // A union next to sibling properties in an `allOf` shares its value with them, so its members cannot be strict.
      const allOf = ast.schema.narrow(this.parent, ast.schema.types.intersection)
      const hasSiblingProperties =
        !!allOf?.members?.includes(node) && allOf.members.some((member) => member.type === ast.schema.types.object && member.properties.length > 0)
      const isStrict = node.strategy === 'one' && !isXor && !isDiscriminated && !hasSiblingProperties
      const members = nodeMembers
        .map((member) => {
          const output = this.transform(isStrict ? strictOneOfNode(member) : member)
          return printNullable(member, output && isStrict ? strictMember({ member: output, node: member, cyclicSchemas }) : output)
        })
        .filter((member): member is string => Boolean(member))

      if (members.length === 0) return ''
      if (members.length === 1) return members[0]!

      if (isDiscriminated) return `v.variant(${text.quote(discriminatorPropertyName)}, ${buildList(members)})`
      const union = `v.union(${buildList(members)})`
      // Valibot has no xor schema, so a check on the raw input counts the members that match.
      return isXor
        ? `((schema) => v.pipe(v.unknown(), v.check((value) => schema.options.filter((member) => v.is(member, value)).length === 1, "Value must match exactly one schema"), schema))(${union})`
        : union
    },
    intersection(node) {
      const members = node.members ?? []
      const [first, ...rest] = members
      if (!first) return ''
      const firstBase = this.transform(first)
      if (!firstBase) return ''

      // An object `allOf` is a merge: one `v.object` with the entries of every member stays usable in `v.variant` and `v.omit`.
      const base = ast.ref.mergeSchema(first)
      const baseObject = ast.schema.narrow(base, ast.schema.types.object)
      if (mergesToObject(node)) {
        // A discriminated `oneOf` base already pins its discriminator to a literal, which a sibling `type: string` would widen.
        const discriminator = ast.schema.narrow(first, ast.schema.types.union)?.discriminatorPropertyName
        // Keyed by name: a property two members declare is one key of the object literal, and the last member wins.
        const properties = new Map(
          preserveRequiredProperties(members)
            .slice(1)
            .flatMap((member) => ast.schema.narrow(member, ast.schema.types.object)?.properties ?? [])
            .filter((property) => property.name !== discriminator)
            .map((property) => [property.name, property] as const),
        )

        const additional = baseObject?.additionalProperties
        const ctor = additional === true ? 'v.looseObject' : additional === false ? 'v.strictObject' : 'v.object'

        return `${ctor}(${buildObject([`...${firstBase}.entries`, ...objectEntries(this, [...properties.values()])])})`
      }

      const schemas = [firstBase]
      // A `not` beside other keywords narrows the schema it sits on, so it checks that schema's value.
      const isNot = (member: ast.SchemaNode) => member.type === ast.schema.types.not
      const actions: Array<string | null> = rest.filter(isNot).map((member) => notCheck(this, member))
      for (const member of rest.filter((member) => !isNot(member))) {
        const constraints = memberActions({ member, base, regexType: this.options.regexType })
        const transformed = constraints.length ? null : this.transform(member)
        actions.push(...constraints)
        if (transformed) schemas.push(transformed)
      }

      return pipe(schemas.length > 1 ? `v.intersect(${buildList(schemas)})` : firstBase, actions)
    },
    not(node) {
      const check = notCheck(this, node)
      return check ? pipe(UNKNOWN, [check]) : null
    },
  }

  return {
    name: 'valibot',
    options,
    nodes: withInputChecks(nodes, (node) => node === uncheckedNode),
    overrides: options.nodes,
    print(node) {
      const transformed = this.transform(node)
      if (!transformed) return null

      const { keysToOmit, direction } = this.options
      const meta = ast.ref.mergeSchema(node)
      const canOmit = keysToOmit?.length && printsEntries(node)
      const value = canOmit ? omitKeys.call(this, { node, transformed, keysToOmit }) : transformed

      return applyModifiers({
        value,
        schema: node,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
        title: hasMetadata(node) ? meta.title : undefined,
        description: hasMetadata(node) ? meta.description : undefined,
        examples: hasMetadata(node) ? meta.examples : undefined,
        direction,
      })
    },
  }
})
