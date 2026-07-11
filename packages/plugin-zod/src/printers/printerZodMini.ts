import { buildList, buildObject, lazyGetter, objectKey, stringify } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import {
  applyMiniModifiers,
  buildEnum,
  formatLiteral,
  isObjectComposableIntersection,
  isObjectSchemaNode,
  lengthChecksMini,
  numberChecksMini,
  omitUnwrapChain,
  patternKeySchemaMini,
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

function strictOneOfMember(member: string, node: ast.SchemaNode): string {
  if (node.type === 'object' && (node.additionalProperties === undefined || node.additionalProperties === false)) {
    return member.replace(/^z\.object\(/, 'z.strictObject(')
  }

  return member
}

function getMemberConstraintMini({ member, regexType }: { member: ast.SchemaNode; regexType: PrinterZodMiniOptions['regexType'] }): string | undefined {
  if (member.primitive === 'string') return lengthChecksMini({ ...(ast.narrowSchema(member, 'string') ?? {}), regexType }) || undefined
  if (member.primitive === 'number' || member.primitive === 'integer')
    return numberChecksMini(ast.narrowSchema(member, 'number') ?? ast.narrowSchema(member, 'integer') ?? {}) || undefined
  if (member.primitive === 'array') return lengthChecksMini({ ...(ast.narrowSchema(member, 'array') ?? {}), regexType }) || undefined
}

/**
 * The Mini printer slice `buildZodMiniObjectShape` needs: the recursive `transform` and the options.
 */
type ZodMiniPrinterContext = {
  transform: (node: ast.SchemaNode) => string | null
  options: PrinterZodMiniOptions
}

/**
 * Builds the `{ key: value, … }` shape for an object node with the functional `zod/mini` modifiers,
 * shared by the `z.object(...)` and `z.extend(...)` renderings so they stay in lockstep.
 */
function buildZodMiniObjectShape(ctx: ZodMiniPrinterContext, node: ast.SchemaNode): string {
  const objectNode = ast.narrowSchema(node, 'object')
  if (!objectNode) return '{}'

  const isCyclic = (schema: ast.SchemaNode): boolean =>
    ctx.options.cyclicSchemas != null && ast.containsCircularRef(schema, { circularSchemas: ctx.options.cyclicSchemas })

  const entries = ast
    .mapSchemaProperties(objectNode, (schema) => {
      const hasSelfRef = isCyclic(schema)
      const savedCyclicSchemas = ctx.options.cyclicSchemas
      if (hasSelfRef) ctx.options.cyclicSchemas = undefined
      const baseOutput = ctx.transform(schema) ?? ctx.transform(ast.factory.createSchema({ type: 'unknown' }))!
      if (hasSelfRef) ctx.options.cyclicSchemas = savedCyclicSchemas
      return baseOutput
    })
    .map(({ name: propName, property, output: baseOutput }) => {
      const { schema } = property
      const meta = ast.syncSchemaRef(schema)

      const value = applyMiniModifiers({
        value: baseOutput,
        schema,
        nullable: meta.nullable,
        optional: schema.optional || property.required === false,
        nullish: schema.nullish,
        defaultValue: meta.default,
      })

      return isCyclic(schema) ? lazyGetter({ name: propName, body: value }) : `${objectKey(propName)}: ${value}`
    })

  return buildObject(entries)
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
          const literals = nonNullValues.map((v) => `z.literal(${formatLiteral(v)})`)
          if (literals.length === 1) return literals[0]!
          return `z.union([${literals.join(', ')}])`
        }

        // Regular enum: z.enum for all-string sets, z.literal/z.union otherwise
        return buildEnum(nonNullValues)
      },

      ref(node) {
        if (!node.name) return null
        // `resolveRefName` prefers the node's `targetName` (set for collision or macro renames),
        // then the $ref path segment, then `node.name` for inline refs.
        const refName = ast.resolveRefName(node) ?? node.name
        const resolvedName = node.ref ? (this.options.resolver?.name(refName) ?? refName) : node.name

        if (node.ref && this.options.cyclicSchemas?.has(refName)) {
          return `z.lazy(() => ${resolvedName})`
        }

        return resolvedName
      },
      object(node) {
        const entries = node.properties ?? []
        const objectBase = `z.object(${buildZodMiniObjectShape(this, node)})`

        // zod/mini has no chainable `.catchall()`/`.strict()`, so route through the functional forms.
        const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []

        if (node.additionalProperties && node.additionalProperties !== true) {
          const catchallType = this.transform(node.additionalProperties)
          return catchallType ? `z.catchall(${objectBase}, ${catchallType})` : objectBase
        }
        if (node.additionalProperties === true) return `z.catchall(${objectBase}, ${this.transform(ast.factory.createSchema({ type: 'unknown' }))})`
        if (node.additionalProperties === false && patterns.length === 0) return objectBase.replace(/^z\.object\(/, 'z.strictObject(')

        if (patterns.length > 0) {
          const values = patterns.map(([, valueSchema]) => {
            const valueType = this.transform(valueSchema) ?? this.transform(ast.factory.createSchema({ type: 'unknown' }))!
            return valueSchema.nullable ? `z.nullable(${valueType})` : valueType
          })
          const distinct = [...new Set(values)]
          const value = distinct.length === 1 ? distinct[0]! : `z.union([${distinct.join(', ')}])`

          if (entries.length > 0) return `z.catchall(${objectBase}, ${value})`
          return `z.record(${patternKeySchemaMini({ patterns: patterns.map(([pattern]) => pattern), regexType: this.options.regexType })}, ${value})`
        }
        return objectBase
      },
      array(node) {
        const items = ast
          .mapSchemaItems(node, (item) => this.transform(item))
          .map(({ output }) => output)
          .filter(Boolean)
        const inner = items.join(', ') || this.transform(ast.factory.createSchema({ type: 'unknown' }))!
        const base = `z.array(${inner})${lengthChecksMini({ ...node, regexType: this.options.regexType })}`

        return node.unique ? `${base}.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })` : base
      },
      tuple(node) {
        const items = ast
          .mapSchemaItems(node, (item) => this.transform(item))
          .map(({ output }) => output)
          .filter(Boolean)

        return `z.tuple(${buildList(items)})`
      },
      union(node) {
        const nodeMembers = node.members ?? []
        const members = ast
          .mapSchemaMembers(node, (memberNode) => this.transform(memberNode))
          .map(({ schema, output }) => (output && node.strategy === 'one' ? strictOneOfMember(output, schema) : output))
          .filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        // z.discriminatedUnion needs every option to be a Zod object. Object variants (refs or
        // `z.extend(…)`-composed `allOf`) qualify; intersections, cyclic `z.lazy(…)` refs, and
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

        // An object `allOf` is a merge, not a runtime intersection: `z.extend(base, { … })` keeps it
        // a Zod object (usable in z.discriminatedUnion) instead of a non-discriminable `z.intersection`.
        if (rest.length > 0 && isObjectComposableIntersection(node, cyclicSchemaNames)) {
          return rest.reduce((acc, member) => `z.extend(${acc}, ${buildZodMiniObjectShape(this, member)})`, firstBase)
        }

        return rest.reduce((acc, member) => {
          const constraint = getMemberConstraintMini({ member, regexType: this.options.regexType })
          if (constraint) return acc + constraint
          const transformed = this.transform(member)
          return transformed ? `z.intersection(${acc}, ${transformed})` : acc
        }, firstBase)
      },
    },
    overrides: options.nodes,
    print(node) {
      const { keysToOmit } = this.options

      const transformed = this.transform(node)
      if (!transformed) return null

      const meta = ast.syncSchemaRef(node)

      const base = (() => {
        if (!keysToOmit?.length || meta.primitive !== 'object' || (meta.type === 'union' && meta.discriminatorPropertyName)) return transformed
        // Discriminated unions (z.discriminatedUnion) do not support .omit(), so skip them.

        // A nullable/optional ref resolves to a ZodMiniNullable/ZodMiniOptional variable; .omit() lives
        // on the inner object, so unwrap down to it first (mirrors printerTs `Omit<NonNullable<T>, …>`).
        // applyMiniModifiers re-applies the nullable/optional wrapper after the omit.
        const unwrap = omitUnwrapChain(node)
        const omit = `.omit({ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} })`

        // If this is a lazy reference, apply omit inside the lazy function
        const lazyMatch = transformed.match(/^z\.lazy\(\(\)\s*=>\s*(.+)\)$/)
        if (lazyMatch) return `z.lazy(() => ${lazyMatch[1]}${unwrap}${omit})`
        return `${transformed}${unwrap}${omit}`
      })()

      return applyMiniModifiers({
        value: base,
        schema: node,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
      })
    },
  }
})
