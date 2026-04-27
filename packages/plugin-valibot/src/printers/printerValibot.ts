import { stringify } from '@internals/utils'
import { ast } from '@kubb/core'
import type { PluginValibot, ResolverValibot } from '../types.ts'
import { applyModifiers, formatLiteral, lengthActions, numberActions, pipe, schemaActions } from '../utils.ts'

export type PrinterValibotNodes = ast.PrinterPartial<string, PrinterValibotOptions>

export type PrinterValibotOptions = {
  coercion?: PluginValibot['resolvedOptions']['coercion']
  guidType?: PluginValibot['resolvedOptions']['guidType']
  dateType?: PluginValibot['resolvedOptions']['dateType']
  optionalType?: PluginValibot['resolvedOptions']['optionalType']
  defaultMode?: PluginValibot['resolvedOptions']['defaultMode']
  metadata?: PluginValibot['resolvedOptions']['metadata']
  readonly?: PluginValibot['resolvedOptions']['readonly']
  wrapOutput?: PluginValibot['resolvedOptions']['wrapOutput']
  resolver?: ResolverValibot
  keysToOmit?: Array<string>
  cyclicSchemas?: ReadonlySet<string>
  nodes?: PrinterValibotNodes
}

export type PrinterValibotFactory = ast.PrinterFactoryOptions<'valibot', PrinterValibotOptions, string, string>

export const printerValibot = ast.definePrinter<PrinterValibotFactory>((options) => {
  return {
    name: 'valibot',
    options,
    nodes: {
      any: () => 'v.any()',
      unknown: () => 'v.unknown()',
      void: () => 'v.void()',
      never: () => 'v.never()',
      boolean: () => 'v.boolean()',
      null: () => 'v.null()',
      string(node) {
        return pipe('v.string()', lengthActions(node))
      },
      number(node) {
        return pipe('v.number()', numberActions(node))
      },
      integer(node) {
        return pipe('v.number()', ['v.integer()', ...numberActions(node)])
      },
      bigint() {
        return 'v.bigint()'
      },
      date(node) {
        if (node.representation === 'string') {
          return pipe('v.string()', ['v.isoDate()'])
        }

        return 'v.date()'
      },
      datetime() {
        return pipe('v.string()', ['v.isoDateTime()'])
      },
      time(node) {
        if (node.representation === 'string') {
          return pipe('v.string()', ['v.isoTime()'])
        }

        return 'v.date()'
      },
      uuid(node) {
        return pipe('v.string()', ['v.uuid()', ...lengthActions(node)])
      },
      email(node) {
        return pipe('v.string()', ['v.email()', ...lengthActions(node)])
      },
      url(node) {
        return pipe('v.string()', ['v.url()', ...lengthActions(node)])
      },
      ipv4: () => pipe('v.string()', ['v.ipv4()']),
      ipv6: () => pipe('v.string()', ['v.ipv6()']),
      blob: () => 'v.instance(File)',
      enum(node) {
        const values = node.namedEnumValues?.map((v) => v.value) ?? node.enumValues ?? []
        const nonNullValues = values.filter((v): v is string | number | boolean => v !== null)

        if (node.namedEnumValues?.length) {
          // Valibot prefers literal unions here; Zod-style enums are modeled as a variant list.
          const literals = nonNullValues.map((v) => `v.literal(${formatLiteral(v)})`)

          if (literals.length === 1) return literals[0]!
          return `v.union([${literals.join(', ')}])`
        }

        return `v.picklist([${nonNullValues.map(formatLiteral).join(', ')}])`
      },
      ref(node) {
        if (!node.name) return undefined
        const refName = node.ref ? (ast.extractRefName(node.ref) ?? node.name) : node.name
        const resolvedName = node.ref ? (this.options.resolver?.default(refName, 'function') ?? refName) : node.name

        if (node.ref && this.options.cyclicSchemas?.has(refName)) {
          return `v.lazy(() => ${resolvedName})`
        }

        return resolvedName
      },
      object(node) {
        const properties = node.properties
          .map((prop) => {
            const { name: propName, schema } = prop
            const meta = ast.syncSchemaRef(schema)

            const hasSelfRef = this.options.cyclicSchemas != null && ast.containsCircularRef(schema, { circularSchemas: this.options.cyclicSchemas })
            if (hasSelfRef) this.options.cyclicSchemas = undefined
            const baseOutput = this.transform(schema) ?? this.transform(ast.createSchema({ type: 'unknown' }))!
            if (hasSelfRef) this.options.cyclicSchemas = options.cyclicSchemas

            const wrappedOutput = this.options.wrapOutput ? this.options.wrapOutput({ output: baseOutput, schema }) || baseOutput : baseOutput
            const descriptionToApply = schema.type !== 'ref' && meta.type === 'ref' ? undefined : meta.description
            const value = applyModifiers({
              value: wrappedOutput,
              nullable: meta.nullable,
              optional: schema.optional,
              nullish: schema.nullish,
              defaultValue: meta.default,
              optionalType: this.options.optionalType,
              defaultMode: this.options.defaultMode,
              actions: schemaActions({ ...schema, description: descriptionToApply }, { metadata: this.options.metadata, readonly: this.options.readonly }),
            })

            if (hasSelfRef) {
              return `get "${propName}"() { return ${value} }`
            }
            return `"${propName}": ${value}`
          })
          .join(',\n    ')

        const entries = `{\n    ${properties}\n    }`

        if (node.additionalProperties && node.additionalProperties !== true) {
          const rest = this.transform(node.additionalProperties) ?? this.transform(ast.createSchema({ type: 'unknown' }))!
          return `v.objectWithRest(${entries}, ${rest})`
        }

        if (node.additionalProperties === true) {
          return `v.objectWithRest(${entries}, ${this.transform(ast.createSchema({ type: 'unknown' }))})`
        }

        if (node.additionalProperties === false) {
          return `v.strictObject(${entries})`
        }

        return `v.object(${entries})`
      },
      array(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
        const inner = items.join(', ') || this.transform(ast.createSchema({ type: 'unknown' }))!
        let result = pipe(`v.array(${inner})`, lengthActions(node))

        if (node.unique) {
          const isUniqueArray = (items: unknown[]) => new Set(items).size === items.length
          result = pipe(result, [`v.check(isUniqueArray, "Array entries must be unique")`])
        }

        return result
      },
      tuple(node) {
        const items = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)

        return `v.tuple([${items.join(', ')}])`
      },
      union(node) {
        const nodeMembers = node.members ?? []
        const members = nodeMembers.map((m) => this.transform(m)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        if (node.discriminatorPropertyName && !nodeMembers.some((m) => m.type === 'intersection')) {
          // Valibot's `variant` is the discriminator-aware shape for OpenAPI oneOf/anyOf.
          return `v.variant(${stringify(node.discriminatorPropertyName)}, [${members.join(', ')}])`
        }

        return `v.union([${members.join(', ')}])`
      },
      intersection(node) {
        const members = (node.members ?? []).map((member) => this.transform(member)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!

        return `v.intersect([${members.join(', ')}])`
      },
      ...options.nodes,
    },
      print(node) {
      const { keysToOmit } = this.options

      let base = this.transform(node)
      if (!base) return null

      const meta = ast.syncSchemaRef(node)

      if (keysToOmit?.length && meta.primitive === 'object' && !(meta.type === 'union' && meta.discriminatorPropertyName)) {
        const keys = `[${keysToOmit.map((key) => stringify(key)).join(', ')}]`
        const lazyMatch = base.match(/^v\.lazy\(\(\)\s*=>\s*(.+)\)$/)
        if (lazyMatch) {
          // Valibot omits keys via function-style helpers, not chainable methods.
          base = `v.lazy(() => v.omit(${lazyMatch[1]}, ${keys}))`
        } else {
          base = `v.omit(${base}, ${keys})`
        }
      }

      return applyModifiers({
        value: base,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
        optionalType: this.options.optionalType,
        defaultMode: this.options.defaultMode,
        actions: schemaActions({ ...node, description: meta.description }, { metadata: this.options.metadata, readonly: this.options.readonly }),
      })
    },
  }
})
