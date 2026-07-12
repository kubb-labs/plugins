import { buildList, buildObject, lazyGetter, objectKey, stringify } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { PluginZod, ResolverZod } from '../types.ts'
import { buildEnum, containsCodec, formatLiteral, isObjectComposableIntersection, isObjectSchemaNode, omitUnwrapChain } from '../utils.ts'
import type { LengthConstraints, ModifierOptions, NumericConstraints } from '../utils.ts'

/**
 * The slice of printer options the shared handlers read. Both `PrinterZodOptions` and
 * `PrinterZodMiniOptions` satisfy this shape; `direction` only exists on the classic printer
 * and stays `undefined` for `zod/mini`.
 */
export type SharedPrinterOptions = {
  /**
   * Use `z.guid()` or `z.uuid()` for UUID/GUID validation.
   */
  guidType?: PluginZod['resolvedOptions']['guidType']
  /**
   * Output form for an OpenAPI `pattern`: a regex literal (`'literal'`) or the
   * `RegExp` constructor (`'constructor'`).
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
   */
  cyclicSchemas?: ReadonlySet<string>
  /**
   * Print direction for codec-bearing fields. Only the classic printer sets this.
   */
  direction?: 'input' | 'output'
}

/**
 * The printer context the shared handlers need: the recursive `transform` and the resolved options.
 */
type SharedPrinterContext = {
  transform: (node: ast.SchemaNode) => string | null
  options: SharedPrinterOptions
}

/**
 * The zod-API-specific emission the shared traversal is parameterized by. `printerZod` maps these
 * to the chainable Zod v4 API (`.catchall(…)`, `.strict()`), `printerZodMini` to the functional
 * `zod/mini` forms (`z.catchall(…)`, `z.strictObject(…)`).
 */
export type ZodDialect = {
  /**
   * Apply nullable / optional / nullish / default modifiers to a schema value. The classic API
   * also applies `.describe()` and `.meta({ examples })`; `zod/mini` ignores both.
   */
  applyModifiers(options: ModifierOptions): string
  /**
   * Build min / max / pattern constraints for strings and arrays.
   */
  lengthConstraints(constraints: LengthConstraints): string
  /**
   * Build numeric bound constraints.
   */
  numberConstraints(constraints: NumericConstraints): string
  /**
   * Build the record key schema enforcing `patternProperties` regexes.
   */
  patternKeySchema(options: { patterns: Array<string>; regexType?: SharedPrinterOptions['regexType'] }): string
  /**
   * Wrap a value schema as nullable.
   */
  nullable(value: string): string
  /**
   * Turn a rendered `z.object(…)` into its strict variant.
   */
  strictObject(objectBase: string): string
  /**
   * Attach a catchall schema for `additionalProperties`.
   */
  catchall(options: { objectBase: string; value: string }): string
  /**
   * Merge an inline object shape into an object base (`allOf` composition), keeping the result a
   * Zod object usable in `z.discriminatedUnion`.
   */
  extend(options: { base: string; shape: string }): string
  /**
   * Combine two members as a runtime intersection.
   */
  intersect(options: { base: string; member: string }): string
  /**
   * Tighten a `oneOf` member so unknown keys fail validation, when the member supports it.
   */
  strictOneOfMember(options: { member: string; schema: ast.SchemaNode; cyclicSchemas?: ReadonlySet<string> }): string
}

type BuildObjectShapeOptions = {
  ctx: SharedPrinterContext
  node: ast.SchemaNode
  dialect: ZodDialect
}

/**
 * Builds the `{ key: value, … }` shape for an object node, shared by the object and
 * extend renderings so they stay in lockstep.
 */
function buildObjectShape({ ctx, node, dialect }: BuildObjectShapeOptions): string {
  const objectNode = ast.narrowSchema(node, 'object')
  if (!objectNode) return '{}'

  const isCyclic = (schema: ast.SchemaNode): boolean =>
    ctx.options.cyclicSchemas != null && ast.containsCircularRef(schema, { circularSchemas: ctx.options.cyclicSchemas })

  const entries = ast
    .mapSchemaProperties(objectNode, (schema) => {
      // Inside a getter the getter itself defers evaluation, so suppress z.lazy() wrapping on
      // nested refs by temporarily clearing cyclicSchemas.
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

      // When a property schema is not a ref but the metadata is from a ref (e.g., discriminator
      // property override), skip applying the description from the ref target to avoid applying
      // metadata from a replaced schema.
      const descriptionToApply = schema.type !== 'ref' && meta.type === 'ref' ? undefined : meta.description

      const value = dialect.applyModifiers({
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

type TransformItemsOptions = {
  ctx: SharedPrinterContext
  node: ast.ArraySchemaNode
}

function transformItems({ ctx, node }: TransformItemsOptions): Array<string> {
  return ast
    .mapSchemaItems(node, (item) => ctx.transform(item))
    .map(({ output }) => output)
    .filter((output): output is string => Boolean(output))
}

type MemberConstraintOptions = {
  member: ast.SchemaNode
  regexType: SharedPrinterOptions['regexType']
  dialect: ZodDialect
}

function memberConstraint({ member, regexType, dialect }: MemberConstraintOptions): string | undefined {
  if (member.primitive === 'string') return dialect.lengthConstraints({ ...(ast.narrowSchema(member, 'string') ?? {}), regexType }) || undefined
  if (member.primitive === 'number' || member.primitive === 'integer')
    return dialect.numberConstraints(ast.narrowSchema(member, 'number') ?? ast.narrowSchema(member, 'integer') ?? {}) || undefined
  if (member.primitive === 'array') return dialect.lengthConstraints({ ...(ast.narrowSchema(member, 'array') ?? {}), regexType }) || undefined
}

type SharedZodNodesOptions = {
  dialect: ZodDialect
  /**
   * Stable snapshot of the printer's `cyclicSchemas`. The object handler temporarily clears
   * `options.cyclicSchemas` while rendering a getter body, but the `oneOf` strictness and
   * discriminability decisions must still see cyclic members inside those bodies.
   */
  cyclicSchemas?: ReadonlySet<string>
}

/**
 * Shared node handlers and root `print` for the two Zod printers. Everything here is the
 * traversal and formatting both APIs agree on; the API-specific emission comes in through
 * `dialect`. The node types left out (`string`, `number`, `integer`, `bigint`, `date`,
 * `datetime`, `time`) genuinely differ between zod and zod/mini and live in each printer.
 */
export function sharedZodNodes({ dialect, cyclicSchemas }: SharedZodNodesOptions) {
  const nodes = {
    any: () => 'z.any()',
    unknown: () => 'z.unknown()',
    void: () => 'z.void()',
    never: () => 'z.never()',
    boolean: () => 'z.boolean()',
    null: () => 'z.null()',
    ipv4: () => 'z.ipv4()',
    ipv6: () => 'z.ipv6()',
    blob: () => 'z.instanceof(File)',
    uuid(node) {
      const base = this.options.guidType === 'guid' ? 'z.guid()' : 'z.uuid()'

      return `${base}${dialect.lengthConstraints({ ...node, regexType: this.options.regexType })}`
    },
    email(node) {
      return `z.email()${dialect.lengthConstraints({ ...node, regexType: this.options.regexType })}`
    },
    url(node) {
      return `z.url()${dialect.lengthConstraints({ ...node, regexType: this.options.regexType })}`
    },
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
      const refName = ast.resolveRefName(node)
      if (!refName) return null

      // In the input direction, a date-bearing component resolves to its `${name}InputSchema`
      // variant so request bodies encode `Date → string` instead of decoding. Only the classic
      // printer sets `direction`.
      const useInputVariant = node.ref != null && this.options.direction === 'input' && containsCodec(node)
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
      const objectBase = `z.object(${buildObjectShape({ ctx: this, node, dialect })})`
      const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []

      if (node.additionalProperties && node.additionalProperties !== true) {
        const catchallType = this.transform(node.additionalProperties)
        return catchallType ? dialect.catchall({ objectBase, value: catchallType }) : objectBase
      }
      if (node.additionalProperties === true) {
        return dialect.catchall({ objectBase, value: this.transform(ast.factory.createSchema({ type: 'unknown' }))! })
      }
      // `additionalProperties: false` still permits patternProperties keys, so skip the strict form when patterns exist.
      if (node.additionalProperties === false && patterns.length === 0) return dialect.strictObject(objectBase)

      // No fixed properties: z.record enforces the key pattern. With fixed properties a record would
      // reject the declared keys, so fall back to a catchall (value validated, key pattern not).
      if (patterns.length > 0) {
        const values = patterns.map(([, valueSchema]) => {
          const valueType = this.transform(valueSchema) ?? this.transform(ast.factory.createSchema({ type: 'unknown' }))!
          return valueSchema.nullable ? dialect.nullable(valueType) : valueType
        })
        const distinct = [...new Set(values)]
        const value = distinct.length === 1 ? distinct[0]! : `z.union([${distinct.join(', ')}])`

        if (entries.length > 0) return dialect.catchall({ objectBase, value })
        return `z.record(${dialect.patternKeySchema({ patterns: patterns.map(([pattern]) => pattern), regexType: this.options.regexType })}, ${value})`
      }
      return objectBase
    },
    array(node) {
      const items = transformItems({ ctx: this, node })
      const inner = items.join(', ') || this.transform(ast.factory.createSchema({ type: 'unknown' }))!
      const base = `z.array(${inner})${dialect.lengthConstraints({ ...node, regexType: this.options.regexType })}`

      return node.unique ? `${base}.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })` : base
    },
    tuple(node) {
      return `z.tuple(${buildList(transformItems({ ctx: this, node }))})`
    },
    union(node) {
      const nodeMembers = node.members ?? []
      const members = ast
        .mapSchemaMembers(node, (memberNode) => this.transform(memberNode))
        .map(({ schema, output }) => (output && node.strategy === 'one' ? dialect.strictOneOfMember({ member: output, schema, cyclicSchemas }) : output))
        .filter(Boolean)
      if (members.length === 0) return ''
      if (members.length === 1) return members[0]!
      // z.discriminatedUnion needs every option to be a Zod object. Object variants (refs or
      // extend-composed `allOf`) qualify; intersections, cyclic `z.lazy(…)` refs, and
      // non-objects fall back to z.union.
      const allDiscriminable = nodeMembers.every((m) => isObjectSchemaNode(m, cyclicSchemas))
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

      // An object `allOf` is a merge, not a runtime intersection: extending keeps it a Zod object
      // (usable in z.discriminatedUnion) instead of a non-discriminable intersection.
      if (rest.length > 0 && isObjectComposableIntersection(node, cyclicSchemas)) {
        return rest.reduce((acc, member) => dialect.extend({ base: acc, shape: buildObjectShape({ ctx: this, node: member, dialect }) }), firstBase)
      }

      return rest.reduce((acc, member) => {
        const constraint = memberConstraint({ member, regexType: this.options.regexType, dialect })
        if (constraint) return acc + constraint
        const transformed = this.transform(member)
        return transformed ? dialect.intersect({ base: acc, member: transformed }) : acc
      }, firstBase)
    },
  } satisfies ast.PrinterPartial<string, SharedPrinterOptions>

  /**
   * Root-level `print`: transforms the node, applies `keysToOmit` via `.omit(…)`, then the
   * top-level modifiers.
   */
  function print(this: SharedPrinterContext, node: ast.SchemaNode): string | null {
    const { keysToOmit } = this.options

    const transformed = this.transform(node)
    if (!transformed) return null

    const meta = ast.syncSchemaRef(node)

    const base = (() => {
      if (!keysToOmit?.length || meta.primitive !== 'object' || (meta.type === 'union' && meta.discriminatorPropertyName)) return transformed
      // Discriminated unions (z.discriminatedUnion) do not support .omit(), so skip them.

      // A nullable/optional ref resolves to a nullable/optional variable; .omit() lives on the
      // inner object schema, so unwrap down to it first (mirrors printerTs `Omit<NonNullable<T>, …>`).
      // applyModifiers re-applies the nullable/optional wrapper after the omit.
      const unwrap = omitUnwrapChain(node)
      const omit = `.omit({ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} })`

      // If this is a lazy reference, apply omit inside the lazy function
      const lazyMatch = transformed.match(/^z\.lazy\(\(\)\s*=>\s*(.+)\)$/)
      if (lazyMatch) return `z.lazy(() => ${lazyMatch[1]}${unwrap}${omit})`
      return `${transformed}${unwrap}${omit}`
    })()

    return dialect.applyModifiers({
      value: base,
      schema: node,
      nullable: meta.nullable,
      optional: meta.optional,
      nullish: meta.nullish,
      defaultValue: meta.default,
      description: meta.description,
      examples: meta.examples,
    })
  }

  return { nodes, print }
}
