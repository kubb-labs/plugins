import { lazyGetter, objectKey } from '@internals/utils'
import { ast, syncSchemaRef } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import {
  applyModifiers,
  buildObjectShape,
  defaultLiteral,
  lengthConstraints,
  numberConstraints,
  patternKeySchema,
  printWithOmit,
  shouldCoerce,
} from '../utils.ts'
import { buildScalarNodes, buildZodNodes, type ZodDialect } from './zodNodes.ts'

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
   * How a non-discriminated `oneOf` is printed: `z.union` with strict members or `z.xor`.
   *
   * @default 'union'
   */
  oneOfType?: PluginZod['resolvedOptions']['oneOfType']
  /**
   * Date format in the OpenAPI spec (`'date'` or `'date-time'`).
   */
  dateType?: ast.ParserOptions['dateType']
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
  // Inline objects are already strict through their node; only a ref needs the runtime call.

  if (node.type === ast.schemaTypes.ref) {
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

    if (schema.type === ast.schemaTypes.object && (schema.additionalProperties === undefined || schema.additionalProperties === false)) {
      return `${member}.strict()`
    }
  }

  return member
}

/**
 * Builds the `{ key: value, … }` shape for an object node with the chainable modifiers.
 */
function buildZodObjectShape(ctx: Parameters<typeof buildObjectShape>[0], node: ast.SchemaNode): string {
  return buildObjectShape(ctx, node, ({ name, value, schema, required, meta, cyclic }) => {
    const body = applyModifiers({
      value,
      schema,
      nullable: meta.nullable,
      optional: schema.optional || required === false,
      nullish: schema.nullish,
      defaultValue: meta.default,
      // When a property schema is not a ref but the metadata is from a ref (e.g., discriminator
      // property override), skip applying the description from the ref target to avoid applying
      // metadata from a replaced schema.
      description: schema.type !== ast.schemaTypes.ref && meta.type === ast.schemaTypes.ref ? undefined : meta.description,
      examples: meta.examples,
    })
    if (!cyclic) return `${objectKey(name)}: ${body}`
    const returnType = recursiveGetterType({ ctx, schema, required })
    return returnType ? `get ${objectKey(name)}(): ${returnType} { return ${body} }` : lazyGetter({ name, body })
  })
}

/**
 * Breaks getter inference cycles without widening recursive refs and arrays to `z.ZodType`.
 */
function recursiveGetterType({
  ctx,
  schema,
  required,
}: {
  ctx: Parameters<typeof buildObjectShape>[0]
  schema: ast.SchemaNode
  required?: boolean
}): string | undefined {
  function baseType(schema: ast.SchemaNode): string | undefined {
    if (ctx.options.nodes?.[schema.type]) return undefined
    if (schema.type === ast.schemaTypes.ref) {
      const saved = ctx.options.cyclicSchemas
      ctx.options.cyclicSchemas = undefined
      const name = ctx.transform(schema)
      ctx.options.cyclicSchemas = saved
      return name ? `typeof ${name}` : undefined
    }
    if (schema.type === ast.schemaTypes.array && schema.items?.length === 1) {
      const item = baseType(schema.items[0]!)
      return item ? `z.ZodArray<${item}>` : undefined
    }
    return undefined
  }
  const base = baseType(schema)
  if (!base) return undefined

  const meta = syncSchemaRef(schema)
  const optional = schema.optional || required === false
  const wrapped = (() => {
    if (schema.nullish || (meta.nullable && optional)) return `z.ZodOptional<z.ZodNullable<${base}>>`
    if (optional) return `z.ZodOptional<${base}>`
    if (meta.nullable) return `z.ZodNullable<${base}>`
    return base
  })()
  return meta.default !== undefined && defaultLiteral(schema, meta.default) !== null ? `z.ZodDefault<${wrapped}>` : wrapped
}

/**
 * Types the direction probe skips. They delegate to their children rather than reading
 * `direction` themselves, so {@link containsDirectionalNode} probes their children instead.
 */
const CONTAINER_TYPES = new Set<ast.SchemaType>([
  ast.schemaTypes.object,
  ast.schemaTypes.array,
  ast.schemaTypes.tuple,
  ast.schemaTypes.union,
  ast.schemaTypes.intersection,
  ast.schemaTypes.ref,
])

type DirectionProbeContext = { options: PrinterZodOptions; transform: () => null; base: () => null; import: () => void }

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
    const context: DirectionProbeContext = { options: { ...printerOptions, direction }, transform: () => null, base: () => null, import: () => {} }
    return (handler as (this: DirectionProbeContext, node: ast.SchemaNode) => string | null).call(context, node)
  }

  return call('decode') !== call('encode')
}

/**
 * Whether the schema transitively contains a node that prints differently per direction, so it
 * must decode on responses and encode on requests. Follows `$ref`s through their resolved schema.
 */
export function containsDirectionalNode({ node, printerOptions }: { node: ast.SchemaNode | undefined; printerOptions: PrinterZodOptions }): boolean {
  if (!node) return false

  return ast.findSchema(node, { predicate: (schema) => variesByDirection({ node: schema, printerOptions }), followRefs: true }) !== undefined
}

/**
 * Names of the `$ref` schemas the generator should route to their input (encode) variant.
 */
export function collectDirectionalRefNames({ node, printerOptions }: { node: ast.SchemaNode; printerOptions: PrinterZodOptions }): Array<string> {
  return ast.collectSync<string>(node, {
    schema: (n) =>
      n.type === ast.schemaTypes.ref && n.ref && containsDirectionalNode({ node: n, printerOptions }) ? (ast.resolveRefName(n) ?? undefined) : undefined,
  })
}

/**
 * Handlers that never recurse into children, so {@link variesByDirection} can call one directly
 * to probe both directions without building a printer.
 *
 * `date` and `time` are the built-in two-way conversions, decoding `string → Date` on responses
 * and encoding back on requests. `date` keeps `date` and `date-time` precision apart. `time` has
 * no date component, so it decodes onto `1970-01-01` UTC and encodes back to `HH:mm:ss`, dropping
 * fractional seconds. Only `representation: 'date'` fields convert; ISO-string fields print the
 * matching `z.iso.*()` either way. A `printer.nodes.date` or `printer.nodes.time` override
 * replaces the whole handler, direction branch included.
 */
const standardDialect: ZodDialect<PrinterZodOptions> = {
  lengths: lengthConstraints,
  numbers: numberConstraints,
  patternKey: patternKeySchema,
  objectShape: buildZodObjectShape,
  coercedInt: 'z.coerce.number().int()',
  catchall: (object, value) => `${object}.catchall(${value})`,
  nullable: (value) => `${value}.nullable()`,
  unique: (array) => `${array}.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })`,
  extend: (base, shape) => `${base}.extend(${shape})`,
  intersection: (left, right) => `${left}.and(${right})`,
  strictMember: strictOneOfMember,
  useInputVariant: (node, options) => options.direction === 'encode' && containsDirectionalNode({ node, printerOptions: options }),
}

const scalarNodes: PrinterZodNodes = {
  ...buildScalarNodes(standardDialect),
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

    // No `z.coerce.date()` branch: `new Date('13:45:00')` is an Invalid Date, so coercion cannot parse a wire time.
    return 'z.iso.time().transform((value) => new Date(`1970-01-01T${value}Z`))'
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
  const nodes: PrinterZodNodes = { ...buildZodNodes(standardDialect, options.cyclicSchemas), ...scalarNodes }

  return {
    name: 'zod',
    options,
    nodes,
    overrides: options.nodes,
    print(node) {
      return printWithOmit(this, node, (value, meta) =>
        applyModifiers({
          value,
          schema: node,
          nullable: meta.nullable,
          optional: meta.optional,
          nullish: meta.nullish,
          defaultValue: meta.default,
          description: meta.description,
          examples: meta.examples,
        }),
      )
    },
  }
})
