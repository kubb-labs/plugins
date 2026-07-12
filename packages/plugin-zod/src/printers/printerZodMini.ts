import { ast } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import { applyMiniModifiers, lengthChecksMini, numberChecksMini, patternKeySchemaMini } from '../utils.ts'
import { sharedZodNodes } from './shared.ts'
import type { ZodDialect } from './shared.ts'

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

function strictOneOfMember({ member, schema }: { member: string; schema: ast.SchemaNode }): string {
  if (schema.type === 'object' && (schema.additionalProperties === undefined || schema.additionalProperties === false)) {
    return member.replace(/^z\.object\(/, 'z.strictObject(')
  }

  return member
}

function nullableMini(value: string): string {
  return `z.nullable(${value})`
}

function strictObjectMini(objectBase: string): string {
  return objectBase.replace(/^z\.object\(/, 'z.strictObject(')
}

function catchallMini({ objectBase, value }: { objectBase: string; value: string }): string {
  return `z.catchall(${objectBase}, ${value})`
}

function extendMini({ base, shape }: { base: string; shape: string }): string {
  return `z.extend(${base}, ${shape})`
}

function intersectionMini({ base, member }: { base: string; member: string }): string {
  return `z.intersection(${base}, ${member})`
}

/**
 * Functional `zod/mini` emission for the shared printer handlers.
 */
const zodMiniDialect: ZodDialect = {
  applyModifiers: applyMiniModifiers,
  lengthConstraints: lengthChecksMini,
  numberConstraints: numberChecksMini,
  patternKeySchema: patternKeySchemaMini,
  nullable: nullableMini,
  strictObject: strictObjectMini,
  catchall: catchallMini,
  extend: extendMini,
  intersect: intersectionMini,
  strictOneOfMember,
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
  const shared = sharedZodNodes({ dialect: zodMiniDialect, cyclicSchemas: options.cyclicSchemas })

  return {
    name: 'zod-mini',
    options,
    nodes: {
      ...shared.nodes,
      string(node) {
        return `z.string()${lengthChecksMini({ ...node, regexType: this.options.regexType })}`
      },
      number(node) {
        return `z.number()${numberChecksMini(node)}`
      },
      integer(node) {
        return `z.int()${numberChecksMini(node)}`
      },
      bigint(node) {
        return `z.bigint()${numberChecksMini(node)}`
      },
      date(node) {
        if (node.representation === 'string') {
          return 'z.iso.date()'
        }

        return 'z.date()'
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
    },
    overrides: options.nodes,
    print: shared.print,
  }
})
