import { ast } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import { applyModifiers, getCodec, lengthConstraints, numberConstraints, patternKeySchema, shouldCoerce } from '../utils.ts'
import { sharedZodNodes } from './shared.ts'
import type { ZodDialect } from './shared.ts'
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
   * Print direction for `dateType: 'date'` fields (`Date` in TypeScript):
   * - `'output'` (default): decode the wire `string` into a `Date` (response bodies).
   * - `'input'`: encode a `Date` back into the wire `string` (request bodies/params).
   *
   * Diverging the directions requires the generator to emit an `${name}InputSchema`
   * variant for each date-bearing component.
   */
  direction?: 'input' | 'output'
  /**
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterZodNodes
}

/**
 * Factory options for the Zod printer, defining input/output types and configuration.
 */
export type PrinterZodFactory = ast.PrinterFactoryOptions<'zod', PrinterZodOptions, string, string>

function strictOneOfMember({ member, schema, cyclicSchemas }: { member: string; schema: ast.SchemaNode; cyclicSchemas?: ReadonlySet<string> }): string {
  if (schema.type === 'object' && schema.additionalProperties === undefined) {
    return `${member}.strict()`
  }

  if (schema.type === 'ref') {
    if (member.startsWith('z.lazy(')) {
      return member
    }

    // A cyclic ref is annotated `z.ZodType`, and a nullable/optional ref is wrapped in
    // ZodNullable/ZodOptional, and neither exposes `.strict()`. Only a bare `ZodObject` ref takes it.
    const refName = ast.resolveRefName(schema)
    if (refName && cyclicSchemas?.has(refName)) {
      return member
    }

    const resolved = ast.syncSchemaRef(schema)

    if (resolved.nullable || resolved.optional || schema.nullable || schema.optional) {
      return member
    }

    if (resolved.type === 'object' && (resolved.additionalProperties === undefined || resolved.additionalProperties === false)) {
      return `${member}.strict()`
    }
  }

  return member
}

/**
 * Chainable Zod v4 emission for the shared printer handlers.
 */
const zodDialect: ZodDialect = {
  applyModifiers,
  lengthConstraints,
  numberConstraints,
  patternKeySchema,
  nullable: (value) => `${value}.nullable()`,
  strictObject: (objectBase) => `${objectBase}.strict()`,
  catchall: ({ objectBase, value }) => `${objectBase}.catchall(${value})`,
  extend: ({ base, shape }) => `${base}.extend(${shape})`,
  intersect: ({ base, member }) => `${base}.and(${member})`,
  strictOneOfMember,
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
  const shared = sharedZodNodes({ dialect: zodDialect, cyclicSchemas: options.cyclicSchemas })

  return {
    name: 'zod',
    options,
    nodes: {
      ...shared.nodes,
      string(node) {
        const base = shouldCoerce(this.options.coercion, 'strings') ? 'z.coerce.string()' : 'z.string()'

        return `${base}${lengthConstraints({ ...node, regexType: this.options.regexType })}`
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
        return shouldCoerce(this.options.coercion, 'numbers') ? 'z.coerce.bigint()' : 'z.bigint()'
      },
      date(node) {
        // representation: 'date' fields are typed as `Date`, so decode/encode at the boundary.
        const codec = getCodec(node)
        if (codec) {
          if (this.options.direction === 'input') return codec.encode(node)
          return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : codec.decode(node)
        }

        return 'z.iso.date()'
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

        return shouldCoerce(this.options.coercion, 'dates') ? 'z.coerce.date()' : 'z.date()'
      },
    },
    overrides: options.nodes,
    print: shared.print,
  }
})
