import { ast } from '@internals/ast'
import { lazyGetter, objectKey } from '@internals/utils'
import { createPrinter } from '@kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import { shouldCoerce } from '@internals/shared'
import { applyMiniModifiers, buildObjectShape, lengthChecksMini, numberChecksMini, patternKeySchemaMini, printWithOmit } from '../utils.ts'
import { containsDirectionalNode, type PrinterZodOptions } from './printerZod.ts'
import { buildZodNodes, withInputChecks, type ZodDialect } from './zodNodes.ts'

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
   * Which way a node converts between its wire type and its runtime type:
   * - `'decode'` (default): wire into runtime, used by response schemas.
   * - `'encode'`: runtime back to wire, used by request bodies and parameters.
   *
   * The built-in handlers ignore it. A `printer.nodes` handler returning different output per
   * direction makes the generator emit an `${name}InputSchema` variant for that component.
   */
  direction?: 'encode' | 'decode'
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
const miniDialect: ZodDialect<PrinterZodMiniOptions> = {
  lengths: lengthChecksMini,
  numbers: numberChecksMini,
  patternKey: patternKeySchemaMini,
  objectShape: buildZodMiniObjectShape,
  coercedInt: 'z.coerce.number().check(z.int())',
  coercedNumber: (schema) => `z.pipe(z.coerce.number(), ${schema})`,
  catchall: (object, value) => `z.catchall(${object}, ${value})`,
  nullable: (value) => `z.nullable(${value})`,
  refine: (value, check) => `${value}.check(z.refine(${check}))`,
  unique: (array) => `${array}.check(z.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" }))`,
  extend: (base, shape) => `z.extend(${base}, ${shape})`,
  intersection: (left, right) => `z.intersection(${left}, ${right})`,
  pipe: (left, right) => `z.pipe(${left}, ${right})`,
  useInputVariant: (node, options) =>
    options.direction === 'encode' && containsDirectionalNode({ node, printerOptions: options as PrinterZodOptions, mini: true }),
}

export const printerZodMini = createPrinter<PrinterZodMiniFactory>((options) => {
  return {
    name: 'zod-mini',
    options,
    nodes: withInputChecks({
      ...buildZodNodes(miniDialect, options.cyclicSchemas),
      bigint(node) {
        const checks = numberChecksMini(ast.schema.getNumberBounds(node), true)
        // `z.int64()` carries the range of the format but takes a bigint only, so the JSON value converts first.
        return node.format === 'int64' || node.format === 'uint64' ? `z.pipe(z.coerce.bigint(), z.${node.format}()${checks})` : `z.coerce.bigint()${checks}`
      },
      date(node) {
        if (node.representation === 'string') {
          return 'z.iso.date()'
        }

        return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : 'z.date()'
      },
      datetime(node) {
        if (node.offset) return 'z.iso.datetime({ offset: true })'
        if (node.local) return 'z.iso.datetime({ local: true })'

        return 'z.iso.datetime()'
      },
      time(node) {
        if (node.representation === 'string') {
          return 'z.iso.time()'
        }

        return 'z.date()'
      },
    }),
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
