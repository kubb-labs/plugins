/**
 * Renders codecs that apply OpenAPI parameter serialization before Effect sends a request.
 */
export function renderParameterRuntime(): string {
  return `
type ParameterKind = 'primitive' | 'array' | 'object'

type ParameterOptions = {
  readonly name: string
  readonly kind: ParameterKind
  readonly style: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'
  readonly explode: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function valueToString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function serializePath({ value, options }: { value: unknown; options: ParameterOptions }): string {
  const { explode, name, style } = options
  if (Array.isArray(value)) {
    const values = value.map(valueToString)
    if (style === 'label') return '.' + values.join(explode ? '.' : ',')
    if (style === 'matrix') return explode ? values.map((item) => ';' + name + '=' + item).join('') : ';' + name + '=' + values.join(',')
    return values.join(',')
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
    const members = entries.map(([key, item]) => (explode ? key + '=' + valueToString(item) : key + ',' + valueToString(item)))
    if (style === 'label') return '.' + members.join(explode ? '.' : ',')
    if (style === 'matrix') return explode ? members.map((member) => ';' + member).join('') : ';' + name + '=' + members.join(',')
    return members.join(',')
  }
  const serialized = valueToString(value)
  if (style === 'label') return '.' + serialized
  if (style === 'matrix') return ';' + name + '=' + serialized
  return serialized
}

function serializeQuery({ value, options }: { value: unknown; options: ParameterOptions }): string | Array<string> | Record<string, string> {
  if (Array.isArray(value)) {
    const values = value.map(valueToString)
    if (options.explode) return values
    const delimiter = options.style === 'spaceDelimited' ? ' ' : options.style === 'pipeDelimited' ? '|' : ','
    return values.join(delimiter)
  }
  if (isRecord(value)) {
    if (options.style === 'deepObject' || options.explode) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, valueToString(item)]))
    return Object.entries(value)
      .flatMap(([key, item]) => [key, valueToString(item)])
      .join(',')
  }
  return valueToString(value)
}

function serializeHeader({ value, explode }: { value: unknown; explode: boolean }): string {
  if (Array.isArray(value)) return value.map(valueToString).join(',')
  if (!isRecord(value)) return valueToString(value)
  const entries = Object.entries(value)
  if (explode) return entries.map(([key, item]) => key + '=' + valueToString(item)).join(',')
  return entries.flatMap(([key, item]) => [key, valueToString(item)]).join(',')
}

function deserialize({ value, options }: { value: unknown; options: ParameterOptions }): unknown {
  if (options.kind === 'primitive' || typeof value !== 'string') return value
  let serialized = value
  if (options.style === 'label') serialized = serialized.slice(1)
  if (options.style === 'matrix') {
    serialized = serialized.startsWith(';') ? serialized.slice(1) : serialized
    if (!options.explode && serialized.startsWith(options.name + '=')) serialized = serialized.slice(options.name.length + 1)
  }
  if (options.kind === 'array') {
    const delimiter = options.style === 'spaceDelimited' ? ' ' : options.style === 'pipeDelimited' ? '|' : options.style === 'label' && options.explode ? '.' : ','
    return serialized.split(delimiter).map((item) => {
      if (options.style === 'matrix' && options.explode && item.startsWith(options.name + '=')) return item.slice(options.name.length + 1)
      return item
    })
  }
  const delimiter = options.style === 'label' && options.explode ? '.' : options.style === 'matrix' && options.explode ? ';' : ','
  const parts = serialized.split(delimiter)
  const entries: Array<[string, string]> = []
  if (options.explode) {
    for (const part of parts) {
      const separator = part.indexOf('=')
      if (separator !== -1) entries.push([part.slice(0, separator), part.slice(separator + 1)])
    }
  } else {
    for (let index = 0; index < parts.length; index += 2) {
      const key = parts[index]
      const item = parts[index + 1]
      if (key !== undefined && item !== undefined) entries.push([key, item])
    }
  }
  return Object.fromEntries(entries)
}

function invalidParameter(value: unknown) {
  return new SchemaIssue.InvalidValue(Option.some(value), { message: 'Could not serialize the OpenAPI parameter' })
}

function parameterCodec<S extends Schema.Constraint, E extends Schema.Constraint>({
  encoded,
  schema,
  options,
  serialize,
}: {
  encoded: E
  schema: S
  options: ParameterOptions
  serialize(value: S['Encoded']): E['Type']
}) {
  return Schema.decodeTo<S, E>(schema, {
      decode: SchemaGetter.transform<S['Encoded'], E['Type']>((value) => deserialize({ value, options }) as S['Encoded']),
      encode: SchemaGetter.transformOrFail<E['Type'], S['Encoded']>((value) => {
        try {
          return Effect.succeed(serialize(value))
        } catch {
          return Effect.fail(invalidParameter(value))
        }
      }),
    })(encoded)
}

/**
 * Applies OpenAPI simple, label, or matrix serialization to a path parameter.
 */
export function pathParameter<S extends Schema.Constraint>(schema: S, options: ParameterOptions) {
  return parameterCodec({ encoded: Schema.String, schema, options, serialize: (value) => serializePath({ value, options }) })
}

/**
 * Applies OpenAPI form, delimited, or deep-object serialization to a query parameter.
 */
export function queryParameter<S extends Schema.Constraint>(schema: S, options: ParameterOptions) {
  const encoded = Schema.Union([
    Schema.String,
    Schema.Array(Schema.String),
    Schema.Record(Schema.String, Schema.String),
  ])
  return parameterCodec({ encoded, schema, options, serialize: (value) => serializeQuery({ value, options }) })
}

/**
 * Applies OpenAPI simple serialization to a header parameter.
 */
export function headerParameter<S extends Schema.Constraint>(schema: S, options: ParameterOptions) {
  return parameterCodec({ encoded: Schema.String, schema, options, serialize: (value) => serializeHeader({ value, explode: options.explode }) })
}
`
}
