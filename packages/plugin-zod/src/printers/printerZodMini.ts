import { stringify } from '@internals/utils'

import { ast } from '@kubb/core'
import type { PluginZod, ResolverZod } from '../types.ts'
import { applyMiniModifiers, formatLiteral, lengthChecksMini, numberChecksMini } from '../utils.ts'

/**
 * Partial map of node-type overrides for the Zod Mini printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`). The function
 * replaces the built-in handler for that node type. Use `this.transform` to
 * recurse into nested schema nodes, and `this.options` to read printer options.
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
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterZodMiniNodes
}

/**
 * Factory options for the Zod Mini printer, defining input/output types and configuration.
 */
export type PrinterZodMiniFactory = ast.PrinterFactoryOptions<'zod-mini', PrinterZodMiniOptions, string, string>

function strictOneOfMember(member: string, node: ast.SchemaNode): string {
  if (node.type === 'object' && (node.additionalProperties === undefined || node.additionalProperties === false)) {
    return member.replace(/^z\.object\(/, 'z.strictObject(')
  }

  return member
}

function getMemberConstraintMini(member: ast.SchemaNode): string | undefined {
  if (member.primitive === 'string') return lengthChecksMini(ast.narrowSchema(member, 'string') ?? {}) || undefined
  if (member.primitive === 'number' || member.primitive === 'integer')
    return numberChecksMini(ast.narrowSchema(member, 'number') ?? ast.narrowSchema(member, 'integer') ?? {}) || undefined
  if (member.primitive === 'array') return lengthChecksMini(ast.narrowSchema(member, 'array') ?? {}) || undefined
}

/**
 * Zod v4 **Mini** printer built with `definePrinter`.
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
export const printerZodMini = ast.definePrinter<PrinterZodMiniFactory>((options) => {
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
        return `z.string()${lengthChecksMini(node)}`
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
      uuid(node) {
        const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'

        return `${base}${lengthChecksMini(node)}`
      },
      email(node) {
        return `z.email()${lengthChecksMini(node)}`
      },
      url(node) {
        return `z.url()${lengthChecksMini(node)}`
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

        // Regular enum: use z.enum([…])
        return `z.enum([${nonNullValues.map(formatLiteral).join(', ')}])`
      },

      ref(node) {
        if (!node.name) return null
        const refName = node.ref ? (ast.extractRefName(node.ref) ?? node.name) : node.name
        const resolvedName = node.ref ? (this.options.resolver?.default(refName, 'function') ?? refName) : node.name

        if (node.ref && this.options.cyclicSchemas?.has(refName)) {
          return `z.lazy(() => ${resolvedName})`
        }

        return resolvedName
      },
      object(node) {
        const entries = node.properties.map((prop) => {
          const { name: propName, schema } = prop

          const meta = ast.syncSchemaRef(schema)

          const isNullable = meta.nullable
          const isOptional = schema.optional
          const isNullish = schema.nullish

          const hasSelfRef = this.options.cyclicSchemas != null && ast.containsCircularRef(schema, { circularSchemas: this.options.cyclicSchemas })
          // Inside a getter the getter itself defers evaluation, so suppress
          // z.lazy() wrapping on nested refs by temporarily clearing cyclicSchemas.
          // Save before clearing: this.options === options (same reference via definePrinter),
          // so reading options.cyclicSchemas after mutation would return undefined.
          const savedCyclicSchemas = this.options.cyclicSchemas
          if (hasSelfRef) this.options.cyclicSchemas = undefined
          const baseOutput = this.transform(schema) ?? this.transform(ast.createSchema({ type: 'unknown' }))!
          if (hasSelfRef) this.options.cyclicSchemas = savedCyclicSchemas

          const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput : baseOutput

          const value = applyMiniModifiers({
            value: wrappedOutput,
            nullable: isNullable,
            optional: isOptional,
            nullish: isNullish,
            defaultValue: meta.default,
          })

          if (hasSelfRef) {
            return `get ${ast.objectKey(propName)}() { return ${value} }`
          }
          return `${ast.objectKey(propName)}: ${value}`
        })

        return `z.object(${ast.buildObject(entries)})`
      },
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || this.transform(ast.createSchema({ type: 'unknown' }))!
        const base = `z.array(${inner})${lengthChecksMini(node)}`

        return node.unique ? `${base}.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })` : base
      },
      tuple(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)

        return `z.tuple(${ast.buildList(items)})`
      },
      union(node) {
        const nodeMembers = node.members ?? []
        const members = nodeMembers
          .map((memberNode) => {
            const member = this.transform(memberNode)

            return member && node.strategy === 'one' ? strictOneOfMember(member, memberNode) : member
          })
          .filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        if (node.discriminatorPropertyName && !nodeMembers.some((m) => m.type === 'intersection')) {
          // z.discriminatedUnion requires ZodObject members; intersections (ZodIntersection) are not
          // assignable to $ZodDiscriminant, so fall back to z.union when any member is an intersection.
          return `z.discriminatedUnion(${stringify(node.discriminatorPropertyName)}, ${ast.buildList(members)})`
        }

        return `z.union(${ast.buildList(members)})`
      },
      intersection(node) {
        const members = node.members ?? []
        if (members.length === 0) return ''

        const [first, ...rest] = members
        if (!first) return ''

        const firstBase = this.transform(first)
        if (!firstBase) return ''

        return rest.reduce((acc, member) => {
          const constraint = getMemberConstraintMini(member)
          if (constraint) return acc + constraint
          const transformed = this.transform(member)
          return transformed ? `z.intersection(${acc}, ${transformed})` : acc
        }, firstBase)
      },
      ...options.nodes,
    },
    print(node) {
      const { keysToOmit } = this.options

      const transformed = this.transform(node)
      if (!transformed) return null

      const meta = ast.syncSchemaRef(node)

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

      return applyMiniModifiers({
        value: base,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
      })
    },
  }
})
