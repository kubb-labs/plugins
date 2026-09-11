import { mapSchemaItems, mapSchemaMembers, mapSchemaProperties } from '@internals/shared'
import { buildList, buildObject, lazyGetter, objectKey, stringify } from '@internals/utils'
import { ast, containsCircularRef, extractRefName, syncSchemaRef } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import {
  applyModifiers,
  buildEnum,
  formatLiteral,
  integerFormatPattern,
  isObjectComposableIntersection,
  isObjectSchemaNode,
  lengthConstraints,
  numberConstraints,
  omitUnwrapChain,
  patternKeySchema,
  shouldCoerce,
} from '../utils.ts'
import type { AdapterOas } from '@kubb/adapter-oas'

/**
 * Partial map of node-type overrides for the Zod printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`). The function
 * replaces the built-in handler for that node type. Use `this.transform` to
 * recurse into nested schema nodes, `this.base` to reuse the output of the
 * handler being replaced, and `this.options` to read printer options.
 *
 * @example Override the `date` handler
 * ```ts
 * pluginZod({
 *   printer: {
 *     nodes: {
 *       date(node) {
 *         return 'z.iso.date()'
 *       },
 *     },
 *   },
 * })
 * ```
 *
 * @example Wrap the built-in output
 * ```ts
 * pluginZod({
 *   printer: {
 *     nodes: {
 *       object(node) {
 *         return `${this.base(node)}.openapi(${JSON.stringify({ description: node.description })})`
 *       },
 *     },
 *   },
 * })
 * ```
 */
export type PrinterZodNodes = ast.PrinterPartial<string, PrinterZodOptions>

export type PrinterZodOptions = {
  /**
   * Enable automatic type coercion for strings, numbers, and dates.
   */
  coercion?: PluginZod['resolvedOptions']['coercion']
  /**
   * Use `z.guid()` or `z.uuid()` for UUID/GUID validation.
   *
   * @default 'uuid'
   */
  guidType?: PluginZod['resolvedOptions']['guidType']
  /**
   * Output form for an OpenAPI `pattern` inside `.regex(...)`: a regex literal
   * (`'literal'`) or the `RegExp` constructor (`'constructor'`).
   *
   * @default 'literal'
   */
  regexType?: PluginZod['resolvedOptions']['regexType']
  /**
   * Date format in the OpenAPI spec (`'date'` or `'date-time'`).
   */
  dateType?: AdapterOas['resolvedOptions']['dateType']
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
   * Which way a node converts between its wire type and its runtime type:
   * - `'decode'` (default): wire into runtime, used by response schemas.
   * - `'encode'`: runtime back to wire, used by request bodies and parameters.
   *
   * Named for the conversion rather than the slot, since Zod's own `z.input` and `z.output`
   * describe a different axis and read inverted here: the `'decode'` schema is the one whose
   * `z.input` is the wire type.
   *
   * A handler returning different output per direction makes the generator emit an
   * `${name}InputSchema` variant for that component.
   */
  direction?: 'encode' | 'decode'
  /**
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterZodNodes
}

/**
 * Factory options for the Zod printer, defining input/output types and configuration.
 */
export type PrinterZodFactory = ast.PrinterFactoryOptions<'zod', PrinterZodOptions, string, string>

function strictOneOfMember(member: string, node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): string {
  if (node.type === 'object' && node.additionalProperties === undefined) {
    return `${member}.strict()`
  }

  if (node.type === 'ref') {
    if (member.startsWith('z.lazy(')) {
      return member
    }

    // A cyclic ref is annotated `z.ZodType`, and a nullable/optional ref is wrapped in
    // ZodNullable/ZodOptional, and neither exposes `.strict()`. Only a bare `ZodObject` ref takes it.
    const refName = ast.resolveRefName(node)
    if (refName && cyclicSchemas?.has(refName)) {
      return member
    }

    const schema = syncSchemaRef(node)

    if (schema.nullable || schema.optional || node.nullable || node.optional) {
      return member
    }

    if (schema.type === 'object' && (schema.additionalProperties === undefined || schema.additionalProperties === false)) {
      return `${member}.strict()`
    }
  }

  return member
}

function getMemberConstraint({ member, regexType }: { member: ast.SchemaNode; regexType: PrinterZodOptions['regexType'] }): string | undefined {
  if (member.primitive === 'string') return lengthConstraints({ ...(ast.narrowSchema(member, 'string') ?? {}), regexType }) || undefined
  if (member.primitive === 'number' || member.primitive === 'integer')
    return numberConstraints(ast.narrowSchema(member, 'number') ?? ast.narrowSchema(member, 'integer') ?? {}) || undefined
  if (member.primitive === 'array') return lengthConstraints({ ...(ast.narrowSchema(member, 'array') ?? {}), regexType }) || undefined
}

/**
 * The printer slice `buildZodObjectShape` needs: the recursive `transform` and the resolved options.
 */
type ZodPrinterContext = {
  transform: (node: ast.SchemaNode) => string | null
  options: PrinterZodOptions
}

/**
 * Builds the `{ key: value, … }` shape for an object node, shared by the `z.object(...)` and
 * `.extend(...)` renderings so they stay in lockstep.
 */
function buildZodObjectShape(ctx: ZodPrinterContext, node: ast.SchemaNode): string {
  const objectNode = ast.narrowSchema(node, 'object')
  if (!objectNode) return '{}'

  const isCyclic = (schema: ast.SchemaNode): boolean =>
    ctx.options.cyclicSchemas != null && containsCircularRef(schema, { circularSchemas: ctx.options.cyclicSchemas })

  const entries = mapSchemaProperties(objectNode, (schema) => {
    // Inside a getter the getter itself defers evaluation, so suppress z.lazy() wrapping on
    // nested refs by temporarily clearing cyclicSchemas.
    const hasSelfRef = isCyclic(schema)
    const savedCyclicSchemas = ctx.options.cyclicSchemas
    if (hasSelfRef) ctx.options.cyclicSchemas = undefined
    const baseOutput = ctx.transform(schema) ?? ctx.transform(ast.factory.createSchema({ type: 'unknown' }))!
    if (hasSelfRef) ctx.options.cyclicSchemas = savedCyclicSchemas
    return baseOutput
  }).map(({ name: propName, property, output: baseOutput }) => {
    const { schema } = property
    const meta = syncSchemaRef(schema)

    // When a property schema is not a ref but the metadata is from a ref (e.g., discriminator
    // property override), skip applying the description from the ref target to avoid applying
    // metadata from a replaced schema.
    const descriptionToApply = schema.type !== 'ref' && meta.type === 'ref' ? undefined : meta.description

    const value = applyModifiers({
      value: baseOutput,
      schema,
      nullable: meta.nullable,
      optional: schema.optional || property.required === false,
      nullish: schema.nullish,
      defaultValue: meta.default,
      description: descriptionToApply,
      examples: meta.examples,
    })

    return isCyclic(schema) ? lazyGetter({ name: propName, body: value }) : `${objectKey(propName)}: ${value}`
  })

  return buildObject(entries)
}

/**
 * Types the direction probe skips. They delegate to their children rather than reading
 * `direction` themselves, so {@link containsDirectionalNode} walks into the children instead.
 */
const CONTAINER_TYPES = new Set<ast.SchemaType>(['object', 'array', 'tuple', 'union', 'intersection', 'ref'])

type DirectionProbeContext = { options: PrinterZodOptions; transform: () => null; base: () => null }

/**
 * Runs the node's effective handler (a `printer.nodes` override, else the built-in) once per
 * direction and reports whether the two disagree. That difference is what makes a component
 * need an `${name}InputSchema` variant.
 */
function variesByDirection({ node, printerOptions }: { node: ast.SchemaNode; printerOptions: PrinterZodOptions }): boolean {
  if (CONTAINER_TYPES.has(node.type)) return false

  const handler = printerOptions.nodes?.[node.type] ?? scalarNodes[node.type]
  if (!handler) return false

  const call = (direction: 'encode' | 'decode') => {
    const context: DirectionProbeContext = { options: { ...printerOptions, direction }, transform: () => null, base: () => null }
    return (handler as (this: DirectionProbeContext, node: ast.SchemaNode) => string | null).call(context, node)
  }

  return call('decode') !== call('encode')
}

/**
 * Whether the schema transitively contains a node that prints differently per direction, so it
 * must decode on responses and encode on requests. Follows `$ref`s through their resolved
 * schema, with `seen` guarding cycles.
 */
export function containsDirectionalNode({
  node,
  printerOptions,
  seen = new Set(),
}: {
  node: ast.SchemaNode | undefined
  printerOptions: PrinterZodOptions
  seen?: Set<string>
}): boolean {
  if (!node) return false

  if (node.type === 'ref') {
    if (!node.ref) return false
    const refName = extractRefName(node.ref)
    if (refName) {
      if (seen.has(refName)) return false
      seen.add(refName)
    }
    const resolved = syncSchemaRef(node)
    if (resolved.type === 'ref') return false
    return containsDirectionalNode({ node: resolved, printerOptions, seen })
  }

  if (variesByDirection({ node, printerOptions })) return true

  const children: Array<ast.SchemaNode | undefined> = []
  if ('properties' in node && node.properties) children.push(...node.properties.map((prop) => prop.schema))
  if ('items' in node && node.items) children.push(...node.items)
  if ('members' in node && node.members) children.push(...node.members)
  if ('additionalProperties' in node && node.additionalProperties && node.additionalProperties !== true) children.push(node.additionalProperties)

  return children.some((child) => containsDirectionalNode({ node: child, printerOptions, seen }))
}

/**
 * Names of the `$ref` schemas the generator should route to their input (encode) variant.
 */
export function collectDirectionalRefNames({ node, printerOptions }: { node: ast.SchemaNode; printerOptions: PrinterZodOptions }): Array<string> {
  return ast.collectSync<string>(node, {
    schema: (n) => (n.type === 'ref' && n.ref && containsDirectionalNode({ node: n, printerOptions }) ? (ast.resolveRefName(n) ?? undefined) : undefined),
  })
}

/**
 * Handlers that never recurse into children, so {@link variesByDirection} can call one directly
 * to probe both directions without building a printer.
 *
 * `date` and `time` are the built-in two-way conversions, decoding `string → Date` on responses and
 * encoding back on requests. `date` keeps `date` and `date-time` precision apart. Only
 * `representation: 'date'` fields convert; ISO-string fields print the matching `z.iso.*()` either
 * way. A `printer.nodes.date` or `printer.nodes.time` override replaces the whole handler, direction
 * branch included.
 */
const scalarNodes: PrinterZodNodes = {
  any: () => 'z.any()',
  unknown: () => 'z.unknown()',
  void: () => 'z.void()',
  never: () => 'z.never()',
  boolean: () => 'z.boolean()',
  null: () => 'z.null()',
  string(node) {
    const base = shouldCoerce(this.options.coercion, 'strings') ? 'z.coerce.string()' : 'z.string()'
    const pattern = node.pattern ?? integerFormatPattern(node.format)

    return `${base}${lengthConstraints({ ...node, pattern, regexType: this.options.regexType })}`
  },
  number(node) {
    const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number()' : 'z.number()'

    return `${base}${numberConstraints(node)}`
  },
  integer(node) {
    const base = shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.number().int()' : 'z.int()'

    return `${base}${numberConstraints(node)}`
  },
  bigint() {
    return 'z.coerce.bigint()'
  },
  date(node) {
    if (node.representation !== 'date') return 'z.iso.date()'

    if (this.options.direction === 'encode') {
      return node.format === 'date' ? 'z.date().transform((value) => value.toISOString().slice(0, 10))' : 'z.date().transform((value) => value.toISOString())'
    }

    const decoded = node.format === 'date' ? 'z.iso.date().transform((value) => new Date(value))' : 'z.iso.datetime().transform((value) => new Date(value))'
    return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : decoded
  },
  datetime(node) {
    const offset = node.offset || this.options.dateType === 'stringOffset'
    const local = node.local || this.options.dateType === 'stringLocal'

    if (offset) return 'z.iso.datetime({ offset: true })'
    if (local) return 'z.iso.datetime({ local: true })'

    return 'z.iso.datetime()'
  },
  time(node) {
    if (node.representation === 'string') {
      return 'z.iso.time()'
    }

    if (this.options.direction === 'encode') {
      return 'z.date().transform((value) => value.toISOString().slice(11, 19))'
    }

    const decoded = 'z.iso.time().transform((value) => new Date(`1970-01-01T${value}`))'
    return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : decoded
  },
  uuid(node) {
    const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'

    return `${base}${lengthConstraints({ ...node, regexType: this.options.regexType })}`
  },
  email(node) {
    return `z.email()${lengthConstraints({ ...node, regexType: this.options.regexType })}`
  },
  url(node) {
    return `z.url()${lengthConstraints({ ...node, regexType: this.options.regexType })}`
  },
  ipv4: () => 'z.ipv4()',
  ipv6: () => 'z.ipv6()',
  blob: () => 'z.instanceof(File)',
  enum(node) {
    const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []
    const nonNullValues = values.filter((v): v is string | number | boolean => v !== null)

    // asConst-style enum: use z.union([z.literal(…), …])
    if (node.namedEnumValues?.length) {
      const literals = nonNullValues.map((v) => `z.literal(${formatLiteral(v)})`)

      if (literals.length === 1) return literals[0]!
      return `z.union([${literals.join(', ')}])`
    }

    // Regular enum: z.enum for all-string sets, z.literal/z.union otherwise
    return buildEnum(nonNullValues)
  },
}

/**
 * Zod v4 printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST into a Zod v4 code string using the chainable API
 * (`.optional()`, `.nullable()`, `.omit()`, etc.). For improved tree-shaking, see {@link printerZodMini}.
 *
 * @example Chainable API
 * ```ts
 * const printer = printerZod({ coercion: false })
 * const code = printer.print(stringNode) // "z.string()"
 * ```
 */
export const printerZod = ast.createPrinter<PrinterZodFactory>((options) => {
  // The object handler temporarily reassigns `options.cyclicSchemas` to `undefined` while rendering a
  // getter body (to suppress nested `z.lazy()`), so capture a stable reference for the `.strict()`
  // skip decision, which must still see cyclic members inside those getter bodies.
  const cyclicSchemaNames = options.cyclicSchemas
  const nodes: PrinterZodNodes = {
    ...scalarNodes,
    ref(node) {
      if (!node.name) return null
      const refName = ast.resolveRefName(node)
      if (!refName) return null

      // In the input direction, a component whose fields print differently by direction resolves
      // to its `${name}InputSchema` variant so request bodies encode instead of decoding.
      const useInputVariant = node.ref != null && this.options.direction === 'encode' && containsDirectionalNode({ node, printerOptions: this.options })
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
      const objectBase = `z.object(${buildZodObjectShape(this, node)})`

      const result = (() => {
        const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []

        if (node.additionalProperties && node.additionalProperties !== true) {
          const catchallType = this.transform(node.additionalProperties)
          return catchallType ? `${objectBase}.catchall(${catchallType})` : objectBase
        }
        if (node.additionalProperties === true) return `${objectBase}.catchall(${this.transform(ast.factory.createSchema({ type: 'unknown' }))})`
        // `additionalProperties: false` still permits patternProperties keys, so skip `.strict()` when patterns exist.
        if (node.additionalProperties === false && patterns.length === 0) return `${objectBase}.strict()`

        // No fixed properties: z.record enforces the key pattern. With fixed properties a record would
        // reject the declared keys, so fall back to .catchall (value validated, key pattern not).
        if (patterns.length > 0) {
          const values = patterns.map(([, valueSchema]) => {
            const valueType = this.transform(valueSchema) ?? this.transform(ast.factory.createSchema({ type: 'unknown' }))!
            return valueSchema.nullable ? `${valueType}.nullable()` : valueType
          })
          const distinct = [...new Set(values)]
          const value = distinct.length === 1 ? distinct[0]! : `z.union([${distinct.join(', ')}])`

          if (entries.length > 0) return `${objectBase}.catchall(${value})`
          return `z.record(${patternKeySchema({ patterns: patterns.map(([pattern]) => pattern), regexType: this.options.regexType })}, ${value})`
        }
        return objectBase
      })()

      return result
    },
    array(node) {
      const items = mapSchemaItems(node, (item) => this.transform(item))
        .map(({ output }) => output)
        .filter(Boolean)
      const inner = items.join(', ') || this.transform(ast.factory.createSchema({ type: 'unknown' }))!
      const base = `z.array(${inner})${lengthConstraints({ ...node, regexType: this.options.regexType })}`

      return node.unique ? `${base}.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })` : base
    },
    tuple(node) {
      const items = mapSchemaItems(node, (item) => this.transform(item))
        .map(({ output }) => output)
        .filter(Boolean)

      return `z.tuple(${buildList(items)})`
    },
    union(node) {
      const nodeMembers = node.members ?? []
      const members = mapSchemaMembers(node, (memberNode) => this.transform(memberNode))
        .map(({ schema, output }) => (output && node.strategy === 'one' ? strictOneOfMember(output, schema, cyclicSchemaNames) : output))
        .filter(Boolean)
      if (members.length === 0) return ''
      if (members.length === 1) return members[0]!
      // z.discriminatedUnion needs every option to be a ZodObject. Object variants (refs or
      // `.extend(…)`-composed `allOf`) qualify; intersections, cyclic `z.lazy(…)` refs, and
      // non-objects fall back to z.union.
      const allDiscriminable = nodeMembers.every((m) => isObjectSchemaNode(m, cyclicSchemaNames))
      if (node.discriminatorPropertyName && allDiscriminable) {
        return `z.discriminatedUnion(${stringify(node.discriminatorPropertyName)}, ${buildList(members)})`
      }

      return `z.union(${buildList(members)})`
    },
    intersection(node) {
      const members = node.members ?? []
      if (members.length === 0) return ''

      const [first, ...rest] = members
      if (!first) return ''

      const firstBase = this.transform(first)
      if (!firstBase) return ''

      // An object `allOf` is a merge, not a runtime intersection: `.extend({ … })` keeps it a
      // ZodObject (usable in z.discriminatedUnion) instead of the non-discriminable `.and(…)`.
      if (rest.length > 0 && isObjectComposableIntersection(node, cyclicSchemaNames)) {
        return rest.reduce((acc, member) => `${acc}.extend(${buildZodObjectShape(this, member)})`, firstBase)
      }

      return rest.reduce((acc, member) => {
        const constraint = getMemberConstraint({ member, regexType: this.options.regexType })
        if (constraint) return acc + constraint
        const transformed = this.transform(member)
        return transformed ? `${acc}.and(${transformed})` : acc
      }, firstBase)
    },
  }

  return {
    name: 'zod',
    options,
    nodes,
    overrides: options.nodes,
    print(node) {
      const { keysToOmit } = this.options

      const transformed = this.transform(node)
      if (!transformed) return null

      const meta = syncSchemaRef(node)

      const base = (() => {
        if (!keysToOmit?.length || meta.primitive !== 'object' || (meta.type === 'union' && meta.discriminatorPropertyName)) return transformed
        // Discriminated unions (z.discriminatedUnion) do not support .omit(), so skip them.

        // A nullable/optional ref resolves to a ZodNullable/ZodOptional variable; .omit() lives on
        // the inner ZodObject, so unwrap down to it first (mirrors printerTs `Omit<NonNullable<T>, …>`).
        // applyModifiers re-applies the nullable/optional wrapper after the omit.
        const unwrap = omitUnwrapChain(node)
        const omit = `.omit({ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} })`

        // If this is a lazy reference, apply omit inside the lazy function
        const lazyMatch = transformed.match(/^z\.lazy\(\(\)\s*=>\s*(.+)\)$/)
        if (lazyMatch) return `z.lazy(() => ${lazyMatch[1]}${unwrap}${omit})`
        return `${transformed}${unwrap}${omit}`
      })()

      return applyModifiers({
        value: base,
        schema: node,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
        description: meta.description,
        examples: meta.examples,
      })
    },
  }
})
