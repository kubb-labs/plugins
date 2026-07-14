/**
 * Renders the generated header codec that nests OpenAPI cookie parameters under `headers.cookies`.
 */
export function renderCookieRuntime(): string {
  return `
/**
 * Metadata for one generated header or cookie parameter.
 */
export type HeaderParameter = {
  readonly name: string
  readonly location: 'header' | 'cookie'
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

function serializeHeaderValue({ value, explode }: { value: unknown; explode: boolean }): string {
  if (Array.isArray(value)) return value.map(valueToString).join(',')
  if (!isRecord(value)) return valueToString(value)
  const entries = Object.entries(value)
  if (explode) return entries.map(([key, item]) => key + '=' + valueToString(item)).join(',')
  return entries.flatMap(([key, item]) => [key, valueToString(item)]).join(',')
}

function serializeCookieValue({ name, value, explode }: { name: string; value: unknown; explode: boolean }): string {
  if (Array.isArray(value)) {
    const values = value.map((item) => encodeURIComponent(valueToString(item)))
    return explode ? values.map((item) => name + '=' + item).join('; ') : name + '=' + values.join(',')
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (explode) return entries.map(([key, item]) => key + '=' + encodeURIComponent(valueToString(item))).join('; ')
    const encoded = entries.flatMap(([key, item]) => [key, valueToString(item)]).map(encodeURIComponent).join(',')
    return name + '=' + encoded
  }
  return name + '=' + encodeURIComponent(valueToString(value))
}

function invalidHeaders(value: unknown) {
  return new SchemaIssue.InvalidValue(Option.some(value), { message: 'Expected encoded headers to be an object' })
}

/**
 * Encodes typed cookie parameters into the Cookie header while retaining typed header fields.
 */
export function headersWithCookies<S extends Schema.Constraint>(schema: S, parameters: ReadonlyArray<HeaderParameter>) {
  const encodedHeaders = Schema.Record(Schema.String, Schema.String)
  return encodedHeaders.pipe(
    Schema.decodeTo(schema, {
      decode: SchemaGetter.transformOrFail((headers) => {
        const decoded: Record<string, unknown> = { ...headers, cookies: Cookies.parseHeader(headers.cookie ?? '') }
        return Schema.decodeUnknownEffect(Schema.toEncoded(schema))(decoded).pipe(Effect.mapError((error) => error.issue))
      }),
      encode: SchemaGetter.transformOrFail((value) => {
        if (!isRecord(value)) return Effect.fail(invalidHeaders(value))
        const headers: Record<string, string> = {}
        const cookies = isRecord(value.cookies) ? value.cookies : {}
        const cookieParts: Array<string> = []
        for (const parameter of parameters) {
          const source = parameter.location === 'cookie' ? cookies : value
          const item = source[parameter.name]
          if (item === undefined || item === null) continue
          if (parameter.location === 'cookie') {
            cookieParts.push(serializeCookieValue({ name: parameter.name, value: item, explode: parameter.explode }))
          } else {
            headers[parameter.name] = serializeHeaderValue({ value: item, explode: parameter.explode })
          }
        }
        const existingCookie = headers.cookie
        if (cookieParts.length) headers.cookie = existingCookie ? existingCookie + '; ' + cookieParts.join('; ') : cookieParts.join('; ')
        return Effect.succeed(headers)
      }),
    }),
  )
}
`
}
