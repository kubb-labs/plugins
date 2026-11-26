import { ast } from '@internals/ast'
import { lazyGetter, objectKey } from '@internals/utils'
import { createPrinter } from '@kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import {
  collectDirectionalRefNames as collectDirectionalRefs,
  containsDirectionalNode as containsDirectional,
  defaultLiteral,
  hasInputChecks,
  shouldCoerce,
  variesByDirection as probeDirection,
} from '@internals/shared'
import { applyModifiers, buildObjectShape, lengthConstraints, numberConstraints, patternKeySchema, printWithOmit } from '../utils.ts'
import type { ObjectShapeContext } from '../utils.ts'
import { buildScalarNodes, buildZodNodes, withInputChecks, type ZodDialect } from './zodNodes.ts'
import type { Direction } from '@internals/shared/types'

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
   * Transforms raw schema names into valid JavaScript identifiers.
   */
  resolver?: ResolverZod
  /**
   * Caches the directional-node lookups of `containsDirectionalNode`. The `setPrinter` factory creates
   * one per printer, so the cache lives as long as that printer. Without it, nothing is cached.
   */
  directionalCache?: WeakMap<ast.SchemaNode, ast.SchemaNode | null>
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
  direction?: Direction
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

  if (node.type === ast.schema.types.ref) {
    if (member.startsWith('z.lazy(')) {
      return member
    }

    // A cyclic ref is annotated `z.ZodType`, and a nullable/optional ref is wrapped in
    // ZodNullable/ZodOptional, and neither exposes `.strict()`. Only a bare `ZodObject` ref takes it.
    const refName = ast.ref.getName(node)
    if (refName && cyclicSchemas?.has(refName)) {
      return member
    }

    const schema = ast.ref.mergeSchema(node)

    if (schema.nullable || schema.optional || node.nullable || node.optional) {
      return member
    }

    if (schema.type === ast.schema.types.object && (schema.additionalProperties === undefined || schema.additionalProperties === false)) {
      // Input checks print a `z.pipe(…)`, which has no `.strict()`, so its object output is made strict.
      // A ref with its own `conditionals` around a target with checks is a pipe in a pipe, which stays as it is.
      const checks = [node, node.schema].filter((entry) => entry && hasInputChecks(entry)).length
      if (checks === 2) return member
      return checks ? `z.pipe(${member}.in, ${member}.out.strict())` : `${member}.strict()`
    }
  }

  return member
}

/**
 * Builds the `{ key: value, … }` shape for an object node with the chainable modifiers.
 */
function buildZodObjectShape(ctx: ObjectShapeContext, node: ast.SchemaNode): string {
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
      description: schema.type !== ast.schema.types.ref && meta.type === ast.schema.types.ref ? undefined : meta.description,
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
function recursiveGetterType({ ctx, schema, required }: { ctx: ObjectShapeContext; schema: ast.SchemaNode; required?: boolean }): string | undefined {
  function baseType(schema: ast.SchemaNode): string | undefined {
    if (ctx.options.nodes?.[schema.type]) return undefined
    if (schema.type === ast.schema.types.ref) {
      const saved = ctx.options.cyclicSchemas
      ctx.options.cyclicSchemas = undefined
      const name = ctx.transform(schema)
      ctx.options.cyclicSchemas = saved
      return name ? `typeof ${name}` : undefined
    }
    if (schema.type === ast.schema.types.array && schema.items?.length === 1) {
      const item = baseType(schema.items[0]!)
      if (!item) return undefined
      return `z.ZodArray<${schema.items[0]!.nullable ? `z.ZodNullable<${item}>` : item}>`
    }
    return undefined
  }
  const base = baseType(schema)
  if (!base) return undefined

  const meta = ast.ref.mergeSchema(schema)
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
  ast.schema.types.object,
  ast.schema.types.array,
  ast.schema.types.tuple,
  ast.schema.types.union,
  ast.schema.types.intersection,
  ast.schema.types.ref,
])

// Whether the effective handler of a node, a `printer.nodes` override or else the built-in, prints differently per direction.
// A container reads its children and not `direction`, and the `zod/mini` built-ins print the same either way.
const varies =
  ({ printerOptions, mini }: { printerOptions: PrinterZodOptions; mini?: boolean }) =>
  (node: ast.SchemaNode) =>
    !CONTAINER_TYPES.has(node.type) &&
    probeDirection({ node, handler: printerOptions.nodes?.[node.type] ?? (mini ? undefined : scalarNodes[node.type]), options: printerOptions })

/**
 * Whether the schema transitively contains a node that prints differently per direction, so it
 * must decode on responses and encode on requests. Follows `$ref`s through their resolved schema.
 * Pass `mini` for the `zod/mini` printer, whose built-in handlers ignore the direction.
 */
export function containsDirectionalNode({
  node,
  printerOptions,
  mini,
}: {
  node: ast.SchemaNode | undefined
  printerOptions: PrinterZodOptions
  mini?: boolean
}): boolean {
  if (mini && !printerOptions.nodes) return false

  return containsDirectional({ node, varies: varies({ printerOptions, mini }), cache: printerOptions.directionalCache })
}

/**
 * Names of the `$ref` schemas the generator should route to their input (encode) variant.
 */
export function collectDirectionalRefNames({
  node,
  printerOptions,
  mini,
}: {
  node: ast.SchemaNode
  printerOptions: PrinterZodOptions
  mini?: boolean
}): Array<string> {
  return collectDirectionalRefs({ node, contains: (ref) => containsDirectionalNode({ node: ref, printerOptions, mini }) })
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
  coercedNumber: (schema) => `z.coerce.number().pipe(${schema})`,
  catchall: (object, value) => `${object}.catchall(${value})`,
  nullable: (value) => `${value}.nullable()`,
  refine: (value, check) => `${value}.refine(${check})`,
  unique: (array) => `${array}.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })`,
  extend: (base, shape) => `${base}.extend(${shape})`,
  intersection: (left, right) => `${left}.and(${right})`,
  pipe: (left, right) => `${left}.pipe(${right})`,
  strictMember: strictOneOfMember,
  useInputVariant: (node, options) => options.direction === 'encode' && containsDirectionalNode({ node, printerOptions: options }),
}

const scalarNodes: PrinterZodNodes = {
  ...buildScalarNodes(standardDialect),
  bigint(node) {
    const constraints = numberConstraints(ast.schema.getNumberBounds(node), true)
    // `z.int64()` carries the range of the format but takes a bigint only, so the JSON value converts first.
    return node.format === 'int64' || node.format === 'uint64' ? `z.coerce.bigint().pipe(z.${node.format}()${constraints})` : `z.coerce.bigint()${constraints}`
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
    const offset = node.offset
    const local = node.local

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
 * Zod v4 printer built with `createPrinter`.
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
export const printerZod = createPrinter<PrinterZodFactory>((options) => {
  const nodes: PrinterZodNodes = withInputChecks({ ...buildZodNodes(standardDialect, options.cyclicSchemas), ...scalarNodes })

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
