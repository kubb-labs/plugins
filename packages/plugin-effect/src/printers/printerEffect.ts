import { ast } from 'kubb/kit'
import type { PluginEffect, ResolverEffect } from '../types.ts'

/**
 * Runtime expression and the matching decoded and encoded TypeScript forms.
 */
export type EffectSchemaCode = {
  /**
   * Effect Schema expression emitted into the generated file.
   */
  runtime: string
  /**
   * Type decoded by the schema.
   */
  type: string
  /**
   * Type accepted by the schema encoder.
   */
  encoded: string
}

/**
 * Partial map of Effect handlers keyed by schema node type.
 *
 * Each handler must keep its runtime, decoded type, and encoded type aligned.
 * Use `this.base(node)` to extend the built-in result.
 */
export type PrinterEffectNodes = ast.PrinterPartial<EffectSchemaCode, PrinterEffectOptions>

/**
 * Options used by the Effect printer.
 */
export type PrinterEffectOptions = {
  /**
   * Output form for OpenAPI regular expressions.
   *
   * @default 'constructor'
   */
  regexType?: PluginEffect['resolvedOptions']['regexType']
  /**
   * Transforms raw schema names into generated identifiers.
   */
  resolver?: ResolverEffect
  /**
   * Properties omitted from an operation schema.
   */
  keysToOmit?: Array<string> | null
  /**
   * Names that participate in circular references.
   */
  cyclicSchemas?: ReadonlySet<string>
  /**
   * Name of the component currently being printed.
   */
  currentSchemaName?: string
  /**
   * Custom node handlers.
   */
  nodes?: PrinterEffectNodes
}

/**
 * Factory contract for the Effect Schema printer.
 */
export type PrinterEffectFactory = ast.PrinterFactoryOptions<'effect', PrinterEffectOptions, EffectSchemaCode, EffectSchemaCode>

type PrinterContext = {
  transform: (node: ast.SchemaNode) => EffectSchemaCode | null
  options: PrinterEffectOptions
}

function schemaCode(runtime: string, type: string, encoded = type): EffectSchemaCode {
  return { runtime, type, encoded }
}

function propertyKey(name: string): string {
  return /^[$A-Z_a-z][$\w]*$/.test(name) ? name : JSON.stringify(name)
}

function valueLiteral(value: unknown): string {
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'undefined'
  if (typeof value === 'boolean' || value === null) return String(value)
  if (Array.isArray(value)) return `[${value.map(valueLiteral).join(', ')}]`
  if (typeof value === 'object' && value) {
    return `{ ${Object.entries(value)
      .map(([key, item]) => `${propertyKey(key)}: ${valueLiteral(item)}`)
      .join(', ')} }`
  }
  return 'undefined'
}

function annotationLiteral(node: ast.SchemaNode, value: unknown): string {
  if (node.type === 'bigint' && (typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint')) {
    return `BigInt(${JSON.stringify(String(value))})`
  }
  if ((node.type === 'date' || node.type === 'time') && node.representation === 'date' && typeof value === 'string') {
    if (node.type === 'date' && node.format !== 'date') return `DateTime.makeUnsafe(${JSON.stringify(value)})`
    return `new Date(${JSON.stringify(value)})`
  }
  if (
    ['string', 'uuid', 'email', 'url', 'ipv4', 'ipv6', 'datetime'].includes(node.type) ||
    ((node.type === 'date' || node.type === 'time') && node.representation !== 'date')
  ) {
    return JSON.stringify(String(value))
  }
  if ((node.type === 'number' || node.type === 'integer') && Number.isFinite(Number(value))) return String(Number(value))
  if (node.type === 'boolean' && (value === 'true' || value === 'false')) return value
  if (node.type === 'enum') {
    const values = node.namedEnumValues?.map((member) => member.value) ?? node.enumValues ?? []
    const match = values.find((member) => member === value || String(member) === String(value))
    if (match !== undefined && match !== null) return valueLiteral(match)
  }
  return valueLiteral(value)
}

function literalType(value: string | number | boolean): string {
  return typeof value === 'string' ? JSON.stringify(value) : String(value)
}

function unionType(types: Array<string>): string {
  const distinct = [...new Set(types)]
  if (!distinct.length) return 'never'
  if (distinct.length === 1) return distinct[0]!
  return distinct.join(' | ')
}

function intersectionType(types: Array<string>): string {
  const distinct = [...new Set(types)]
  if (!distinct.length) return 'unknown'
  if (distinct.length === 1) return distinct[0]!
  return distinct.map((type) => (type.includes(' | ') ? `(${type})` : type)).join(' & ')
}

function regexp(pattern: string, regexType: PrinterEffectOptions['regexType']): string {
  if (regexType !== 'literal') return `new RegExp(${JSON.stringify(pattern)})`
  const escaped = pattern.replaceAll('/', '\\/').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  return `/${escaped}/`
}

function checks(items: Array<string>): string {
  return items.length ? `.check(${items.join(', ')})` : ''
}

function lengthChecks(node: { min?: number; max?: number; pattern?: string }, regexType: PrinterEffectOptions['regexType']): string {
  return checks([
    ...(node.min !== undefined ? [`Schema.isMinLength(${node.min})`] : []),
    ...(node.max !== undefined ? [`Schema.isMaxLength(${node.max})`] : []),
    ...(node.pattern !== undefined ? [`Schema.isPattern(${regexp(node.pattern, regexType)})`] : []),
  ])
}

function numberChecks(node: { min?: number; max?: number; exclusiveMinimum?: number; exclusiveMaximum?: number; multipleOf?: number }): Array<string> {
  return [
    ...(node.min !== undefined ? [`Schema.isGreaterThanOrEqualTo(${node.min})`] : []),
    ...(node.max !== undefined ? [`Schema.isLessThanOrEqualTo(${node.max})`] : []),
    ...(node.exclusiveMinimum !== undefined ? [`Schema.isGreaterThan(${node.exclusiveMinimum})`] : []),
    ...(node.exclusiveMaximum !== undefined ? [`Schema.isLessThan(${node.exclusiveMaximum})`] : []),
    ...(node.multipleOf !== undefined ? [`Schema.isMultipleOf(${node.multipleOf})`] : []),
  ]
}

function inferredFormat(node: ast.SchemaNode): string | undefined {
  if ('format' in node && typeof node.format === 'string') return node.format
  switch (node.type) {
    case 'uuid':
    case 'email':
    case 'url':
    case 'ipv4':
    case 'ipv6':
      return node.type
    case 'datetime':
      return 'date-time'
    case 'time':
      return 'time'
    default:
      return undefined
  }
}

function annotate(runtime: string, node: ast.SchemaNode): string {
  const annotations: Array<string> = []
  const format = inferredFormat(node)
  if (format) annotations.push(`format: ${JSON.stringify(format)}`)
  if (node.description) annotations.push(`description: ${JSON.stringify(node.description)}`)
  if (node.default !== undefined) annotations.push(`default: ${annotationLiteral(node, node.default)}`)
  if (node.examples?.length) annotations.push(`examples: [${node.examples.map((example) => annotationLiteral(node, example)).join(', ')}]`)
  if (node.readOnly) annotations.push('readOnly: true')
  if (node.writeOnly) annotations.push('writeOnly: true')
  return annotations.length ? `${runtime}.annotate({ ${annotations.join(', ')} })` : runtime
}

function applyModifiers(code: EffectSchemaCode, node: ast.SchemaNode, includeOptional = true): EffectSchemaCode {
  const nullable = !!node.nullable
  const optional = includeOptional && !!node.optional
  const nullish = !!node.nullish || (nullable && optional)
  const runtime = (() => {
    if (nullish) return `Schema.NullishOr(${code.runtime})`
    if (nullable) return `Schema.NullOr(${code.runtime})`
    if (optional) return `Schema.UndefinedOr(${code.runtime})`
    return code.runtime
  })()
  const type = unionType([code.type, ...(nullable || nullish ? ['null'] : []), ...(optional || nullish ? ['undefined'] : [])])
  const encoded = unionType([code.encoded, ...(nullable || nullish ? ['null'] : []), ...(optional || nullish ? ['undefined'] : [])])
  return { runtime, type, encoded }
}

function finish(code: EffectSchemaCode, node: ast.SchemaNode, includeOptional = true): EffectSchemaCode {
  return applyModifiers({ ...code, runtime: annotate(code.runtime, node) }, node, includeOptional)
}

function buildObject(ctx: PrinterContext, node: ast.ObjectSchemaNode, keysToOmit: ReadonlySet<string> = new Set()): EffectSchemaCode {
  const fields: Array<string> = []
  const typeFields: Array<string> = []
  const encodedFields: Array<string> = []

  for (const property of node.properties ?? []) {
    if (keysToOmit.has(property.name)) continue
    const base = ctx.transform(property.schema) ?? schemaCode('Schema.Unknown', 'unknown')
    const meta = ast.syncSchemaRef(property.schema)
    const optional = property.required === false || !!property.schema.optional || !!meta.optional || !!property.schema.nullish || !!meta.nullish
    const propertyNode: ast.SchemaNode = { ...meta, optional: false, nullish: false }
    const value = finish(base, propertyNode, false)
    const runtime = optional ? `Schema.optionalKey(${value.runtime})` : value.runtime
    const key = propertyKey(property.name)
    fields.push(`${key}: ${runtime}`)
    typeFields.push(`readonly ${key}${optional ? '?' : ''}: ${value.type}`)
    encodedFields.push(`readonly ${key}${optional ? '?' : ''}: ${value.encoded}`)
  }

  const struct = `Schema.Struct({${fields.length ? ` ${fields.join(', ')} ` : ''}})`
  const type = `{${typeFields.length ? ` ${typeFields.join('; ')} ` : ''}}`
  const encoded = `{${encodedFields.length ? ` ${encodedFields.join('; ')} ` : ''}}`
  const records: Array<EffectSchemaCode> = []

  for (const [pattern, valueNode] of Object.entries(node.patternProperties ?? {})) {
    const value = finish(ctx.transform(valueNode) ?? schemaCode('Schema.Unknown', 'unknown'), valueNode)
    records.push({
      runtime: `Schema.Record(Schema.String.check(Schema.isPattern(${regexp(pattern, ctx.options.regexType)})), ${value.runtime})`,
      type: `Readonly<Record<string, ${value.type}>>`,
      encoded: `Readonly<Record<string, ${value.encoded}>>`,
    })
  }

  if (node.additionalProperties === true) {
    records.push(schemaCode('Schema.Record(Schema.String, Schema.Json)', 'Readonly<Record<string, Schema.Json>>'))
  } else if (node.additionalProperties) {
    const value = finish(ctx.transform(node.additionalProperties) ?? schemaCode('Schema.Unknown', 'unknown'), node.additionalProperties)
    records.push({
      runtime: `Schema.Record(Schema.String, ${value.runtime})`,
      type: `Readonly<Record<string, ${value.type}>>`,
      encoded: `Readonly<Record<string, ${value.encoded}>>`,
    })
  }

  if (!records.length) return schemaCode(struct, type, encoded)
  return {
    runtime: `Schema.StructWithRest(${struct}, [${records.map((record) => record.runtime).join(', ')}])`,
    type: intersectionType([type, ...records.map((record) => record.type)]),
    encoded: intersectionType([encoded, ...records.map((record) => record.encoded)]),
  }
}

function omitRef(code: EffectSchemaCode, node: ast.RefSchemaNode, keys: Array<string>): EffectSchemaCode {
  const resolved = ast.syncSchemaRef(node)
  const source = code.runtime.startsWith('Schema.suspend(') ? code.type : code.runtime
  const hasRest = resolved.type === 'object' && !!(resolved.additionalProperties || resolved.patternProperties)
  const fields = hasRest ? `${source}.schema.fields` : `${source}.fields`
  const struct = `Schema.Struct(Struct.omit(${fields}, ${valueLiteral(keys)}))`
  const runtime = hasRest ? `Schema.StructWithRest(${struct}, ${source}.records)` : struct
  const keyType = unionType(keys.map((key) => JSON.stringify(key)))
  return {
    runtime,
    type: `Omit<NonNullable<${code.type}>, ${keyType}>`,
    encoded: `Omit<NonNullable<${code.encoded}>, ${keyType}>`,
  }
}

function omitRoot(ctx: PrinterContext, node: ast.SchemaNode, code: EffectSchemaCode, keys: Array<string>): EffectSchemaCode {
  if (node.type === 'object') return buildObject(ctx, node, new Set(keys))
  if (node.type === 'ref') return omitRef(code, node, keys)
  if (node.type === 'union') {
    const members = (node.members ?? []).map((member) => {
      const transformed = ctx.transform(member) ?? schemaCode('Schema.Unknown', 'unknown')
      return finish(omitRoot(ctx, member, transformed, keys), member)
    })
    return {
      runtime: `Schema.Union([${members.map((member) => member.runtime).join(', ')}]${node.strategy === 'one' ? ', { mode: "oneOf" }' : ''})`,
      type: unionType(members.map((member) => member.type)),
      encoded: unionType(members.map((member) => member.encoded)),
    }
  }
  return code
}

function typeFromPath(path: string | undefined): string {
  if (!path) return 'string'
  const value = path.replaceAll('`', '\\`').replace(/\{[^}]+\}/g, '${string}')
  return `\`${value}\``
}

function containsTransformation(node: ast.SchemaNode, seen: Set<string> = new Set()): boolean {
  if ((node.type === 'date' || node.type === 'time') && node.representation === 'date') return true
  if (node.type === 'ref') {
    const name = ast.resolveRefName(node)
    if (name) {
      if (seen.has(name)) return false
      seen.add(name)
    }
    const resolved = ast.syncSchemaRef(node)
    return resolved.type !== 'ref' && containsTransformation(resolved, seen)
  }
  if ('properties' in node && node.properties?.some((property) => containsTransformation(property.schema, seen))) return true
  if ('items' in node && node.items?.some((item) => containsTransformation(item, seen))) return true
  if ('members' in node && node.members?.some((member) => containsTransformation(member, seen))) return true
  if ('additionalProperties' in node && node.additionalProperties && node.additionalProperties !== true) {
    return containsTransformation(node.additionalProperties, seen)
  }
  return false
}

function isObjectNode(node: ast.SchemaNode): node is ast.ObjectSchemaNode {
  return node.type === 'object'
}

/**
 * Prints Kubb schema nodes as Effect v4 Schema expressions and matching types.
 */
export const printerEffect = ast.createPrinter<PrinterEffectFactory>((options) => ({
  name: 'effect',
  options,
  nodes: {
    any: () => schemaCode('Schema.Any', 'any'),
    unknown: () => schemaCode('Schema.Unknown', 'unknown'),
    void: () => schemaCode('Schema.Void', 'void'),
    never: () => schemaCode('Schema.Never', 'never'),
    boolean: () => schemaCode('Schema.Boolean', 'boolean'),
    null: () => schemaCode('Schema.Null', 'null'),
    string(node) {
      return schemaCode(`Schema.String${lengthChecks(node, this.options.regexType)}`, 'string')
    },
    number(node) {
      return schemaCode(`Schema.Number${checks(['Schema.isFinite()', ...numberChecks(node)])}`, 'number')
    },
    integer(node) {
      return schemaCode(`Schema.Number${checks(['Schema.isFinite()', 'Schema.isInt()', ...numberChecks(node)])}`, 'number')
    },
    bigint: () => schemaCode('Schema.BigInt', 'bigint'),
    date(node) {
      if (node.representation !== 'date') return schemaCode('Schema.String', 'string')
      if (node.format === 'date') {
        return schemaCode(
          'Schema.String.pipe(Schema.decodeTo(Schema.DateValid, { decode: SchemaGetter.transform((value) => new Date(`${value}T00:00:00.000Z`)), encode: SchemaGetter.transform((value) => value.toISOString().slice(0, 10)) }))',
          'Date',
          'string',
        )
      }
      return schemaCode('Schema.DateTimeUtcFromString', 'DateTime.Utc', 'string')
    },
    datetime: () => schemaCode('Schema.String', 'string'),
    time(node) {
      return node.representation === 'date'
        ? schemaCode('Schema.DateFromString.check(Schema.isDateValid())', 'Date', 'string')
        : schemaCode('Schema.String', 'string')
    },
    uuid(node) {
      return schemaCode(`Schema.String${lengthChecks(node, this.options.regexType)}`, 'string')
    },
    email(node) {
      return schemaCode(`Schema.String${lengthChecks(node, this.options.regexType)}`, 'string')
    },
    url(node) {
      return schemaCode(`Schema.String${lengthChecks(node, this.options.regexType)}`, typeFromPath(node.path))
    },
    ipv4: () => schemaCode('Schema.String', 'string'),
    ipv6: () => schemaCode('Schema.String', 'string'),
    blob: () => schemaCode('Schema.instanceOf(Blob)', 'Blob'),
    enum(node) {
      const values = (node.namedEnumValues?.map((value) => value.value) ?? node.enumValues ?? []).filter(
        (value): value is string | number | boolean => value !== null && value !== undefined,
      )
      if (!values.length) return schemaCode('Schema.Never', 'never')
      if (values.length === 1) return schemaCode(`Schema.Literal(${valueLiteral(values[0])})`, literalType(values[0]!))
      return schemaCode(`Schema.Literals(${valueLiteral(values)})`, unionType(values.map(literalType)))
    },
    ref(node) {
      const refName = ast.resolveRefName(node)
      if (!refName) return null
      const name = node.ref ? (this.options.resolver?.name(refName) ?? refName) : node.name!
      const isCyclic = !!node.ref && !!this.options.cyclicSchemas?.has(refName)
      const encoded = isCyclic && name === this.options.currentSchemaName ? `${name}Encoded` : `typeof ${name}.Encoded`
      const runtime = isCyclic ? `Schema.suspend((): Schema.Codec<${name}, ${encoded}> => ${name})` : name
      return schemaCode(runtime, name, encoded)
    },
    object(node) {
      return buildObject(this, node)
    },
    array(node) {
      const items = (node.items ?? []).map((item) => finish(this.transform(item) ?? schemaCode('Schema.Unknown', 'unknown'), item))
      const item =
        items.length === 0
          ? schemaCode('Schema.Unknown', 'unknown')
          : items.length === 1
            ? items[0]!
            : schemaCode(
                `Schema.Union([${items.map((entry) => entry.runtime).join(', ')}])`,
                unionType(items.map((entry) => entry.type)),
                unionType(items.map((entry) => entry.encoded)),
              )
      const runtime = `Schema.Array(${item.runtime})${lengthChecks(node, this.options.regexType)}${node.unique ? '.check(Schema.isUnique())' : ''}`
      return schemaCode(runtime, `ReadonlyArray<${item.type}>`, `ReadonlyArray<${item.encoded}>`)
    },
    tuple(node) {
      const items = (node.items ?? []).map((item) => finish(this.transform(item) ?? schemaCode('Schema.Unknown', 'unknown'), item))
      return schemaCode(
        `Schema.Tuple([${items.map((item) => item.runtime).join(', ')}])`,
        `readonly [${items.map((item) => item.type).join(', ')}]`,
        `readonly [${items.map((item) => item.encoded).join(', ')}]`,
      )
    },
    union(node) {
      const members = (node.members ?? []).map((member) => finish(this.transform(member) ?? schemaCode('Schema.Unknown', 'unknown'), member))
      if (!members.length) return schemaCode('Schema.Never', 'never')
      if (members.length === 1) return members[0]!
      return {
        runtime: `Schema.Union([${members.map((member) => member.runtime).join(', ')}]${node.strategy === 'one' ? ', { mode: "oneOf" }' : ''})`,
        type: unionType(members.map((member) => member.type)),
        encoded: unionType(members.map((member) => member.encoded)),
      }
    },
    intersection(node) {
      const members = node.members ?? []
      const outputs = members.map((member) => finish(this.transform(member) ?? schemaCode('Schema.Unknown', 'unknown'), member))
      if (!outputs.length) return schemaCode('Schema.Unknown', 'unknown')
      if (outputs.length === 1) return outputs[0]!

      const objectMembers = members.map((member) => ast.syncSchemaRef(member))
      if (objectMembers.every(isObjectNode)) {
        const fieldSources = outputs.map((output, index) => {
          const member = objectMembers[index]!
          return member.additionalProperties || member.patternProperties ? `${output.runtime}.schema.fields` : `${output.runtime}.fields`
        })
        const struct = `Schema.Struct({ ${fieldSources.map((source) => `...${source}`).join(', ')} })`
        const recordSources = outputs.flatMap((output, index) => {
          const member = objectMembers[index]!
          return member.additionalProperties || member.patternProperties ? [`...${output.runtime}.records`] : []
        })
        return {
          runtime: recordSources.length ? `Schema.StructWithRest(${struct}, [${recordSources.join(', ')}])` : struct,
          type: intersectionType(outputs.map((output) => output.type)),
          encoded: intersectionType(outputs.map((output) => output.encoded)),
        }
      }

      if (members.some((member) => containsTransformation(member))) {
        throw new Error(`Effect cannot safely compose a transforming allOf schema${node.name ? ` "${node.name}"` : ''}. Add a printer intersection override.`)
      }
      const type = intersectionType(outputs.map((output) => output.type))
      return schemaCode(
        `Schema.declare<${type}>((value): value is ${type} => [${outputs.map((output) => output.runtime).join(', ')}].every((schema) => Schema.is(schema)(value)))`,
        type,
      )
    },
  },
  overrides: options.nodes,
  print(node) {
    const transformed = this.transform(node)
    if (!transformed) return null
    const meta = ast.syncSchemaRef(node)
    const omitted = this.options.keysToOmit?.length ? omitRoot(this, node, transformed, this.options.keysToOmit) : transformed
    return finish(omitted, meta)
  },
}))
