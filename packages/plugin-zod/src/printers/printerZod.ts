import {
  buildList,
  buildObject,
  extractRefName,
  lazyGetter,
  mapSchemaItems,
  mapSchemaMembers,
  mapSchemaProperties,
  objectKey,
  stringify,
} from '@kubb/ast/utils'

import { ast } from '@kubb/core'
import { containsCircularRef, syncSchemaRef } from '@kubb/ast/utils'
import type { PluginZod, ResolverZod } from '../types.ts'
import { applyModifiers, buildEnum, containsCodec, formatLiteral, getCodec, lengthConstraints, numberConstraints, patternKeySchema, shouldCoerce } from '../utils.ts'
import type { AdapterOas } from '@kubb/adapter-oas'

/**
 * Partial map of node-type overrides for the Zod printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`). The function
 * replaces the built-in handler for that node type. Use `this.transform` to
 * recurse into nested schema nodes, and `this.options` to read printer options.
 *
 * @example Override the `date` handler
 * ```ts
 * pluginZod({
 *   printer: {
 *     nodes: {
 *       date(node) {
 *         return 'z.string().date()'
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
   * Hook to transform generated Zod schema before output.
   */
  wrapOutput?: PluginZod['resolvedOptions']['wrapOutput']
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
   * - `'output'` (default) — decode the wire `string` into a `Date` (response bodies).
   * - `'input'` — encode a `Date` back into the wire `string` (request bodies/params).
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

function strictOneOfMember(member: string, node: ast.SchemaNode): string {
  if (node.type === 'object' && node.additionalProperties === undefined) {
    return `${member}.strict()`
  }

  if (node.type === 'ref') {
    if (member.startsWith('z.lazy(')) {
      return member
    }

    const schema = syncSchemaRef(node)

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
  return {
    name: 'zod',
    options,
    nodes: {
      any: () => 'z.any()',
      unknown: () => 'z.unknown()',
      void: () => 'z.void()',
      never: () => 'z.never()',
      boolean: () => 'z.boolean()',
      null: () => 'z.null()',
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
        // representation: 'date' → typed as `Date`; decode/encode at the boundary.
        const codec = getCodec(node)
        if (codec) {
          return this.options.direction === 'input' ? codec.encode(node) : codec.decode(node)
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
      ref(node) {
        if (!node.name) return null
        const refName = node.ref ? (extractRefName(node.ref) ?? node.name) : node.name

        // In the input direction, a date-bearing component resolves to its `${name}InputSchema`
        // variant so request bodies encode `Date → string` instead of decoding.
        const useInputVariant = node.ref != null && this.options.direction === 'input' && containsCodec(node)
        const resolvedName = node.ref
          ? useInputVariant
            ? (this.options.resolver?.resolveInputSchemaName(refName) ?? refName)
            : (this.options.resolver?.default(refName, 'function') ?? refName)
          : node.name

        if (node.ref && this.options.cyclicSchemas?.has(refName)) {
          return `z.lazy(() => ${resolvedName})`
        }

        return resolvedName
      },
      object(node) {
        const isCyclic = (schema: ast.SchemaNode): boolean =>
          this.options.cyclicSchemas != null && containsCircularRef(schema, { circularSchemas: this.options.cyclicSchemas })

        const entries = mapSchemaProperties(node, (schema) => {
          // Inside a getter the getter itself defers evaluation, so suppress z.lazy() wrapping on
          // nested refs by temporarily clearing cyclicSchemas. Save before clearing: this.options
          // === options (same reference via definePrinter), so reading it after mutation returns undefined.
          const hasSelfRef = isCyclic(schema)
          const savedCyclicSchemas = this.options.cyclicSchemas
          if (hasSelfRef) this.options.cyclicSchemas = undefined
          const baseOutput = this.transform(schema) ?? this.transform(ast.factory.createSchema({ type: 'unknown' }))!
          if (hasSelfRef) this.options.cyclicSchemas = savedCyclicSchemas
          return baseOutput
        }).map(({ name: propName, property, output: baseOutput }) => {
          const { schema } = property
          const meta = syncSchemaRef(schema)

          const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput : baseOutput

          // When a property schema is not a ref but the metadata is from a ref (e.g., discriminator
          // property override), skip applying the description from the ref target to avoid applying
          // metadata from a replaced schema.
          const descriptionToApply = schema.type !== 'ref' && meta.type === 'ref' ? undefined : meta.description

          const value = applyModifiers({
            value: wrappedOutput,
            nullable: meta.nullable,
            optional: schema.optional || property.required === false,
            nullish: schema.nullish,
            defaultValue: meta.default,
            description: descriptionToApply,
            examples: meta.examples,
          })

          return isCyclic(schema) ? lazyGetter({ name: propName, body: value }) : `${objectKey(propName)}: ${value}`
        })

        const objectBase = `z.object(${buildObject(entries)})`

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
          .map(({ schema, output }) => (output && node.strategy === 'one' ? strictOneOfMember(output, schema) : output))
          .filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        if (node.discriminatorPropertyName && !nodeMembers.some((m) => m.type === 'intersection')) {
          // z.discriminatedUnion requires ZodObject members; intersections (ZodIntersection) are not
          // assignable to $ZodDiscriminant, so fall back to z.union when any member is an intersection.
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

        return rest.reduce((acc, member) => {
          const constraint = getMemberConstraint({ member, regexType: this.options.regexType })
          if (constraint) return acc + constraint
          const transformed = this.transform(member)
          return transformed ? `${acc}.and(${transformed})` : acc
        }, firstBase)
      },
      ...options.nodes,
    },
    print(node) {
      const { keysToOmit } = this.options

      const transformed = this.transform(node)
      if (!transformed) return null

      const meta = syncSchemaRef(node)

      const base = (() => {
        if (!keysToOmit?.length || meta.primitive !== 'object' || (meta.type === 'union' && meta.discriminatorPropertyName)) return transformed
        // Mirror printerTs `nonNullable: true`: when omitting keys, the resulting
        // schema is a new non-nullable object type — skip optional/nullable/nullish.
        // Discriminated unions (z.discriminatedUnion) do not support .omit(), so skip them.

        // If this is a lazy reference, apply omit inside the lazy function
        const lazyMatch = transformed.match(/^z\.lazy\(\(\)\s*=>\s*(.+)\)$/)
        if (lazyMatch) return `z.lazy(() => ${lazyMatch[1]}.omit({ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} }))`
        return `${transformed}.omit({ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} })`
      })()

      return applyModifiers({
        value: base,
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
