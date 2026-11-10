export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>

/**
 * A body `fetch` accepts, read from `RequestInit` so a project without the `dom` lib still has it.
 */
export type RequestBody = NonNullable<RequestInit['body']>

export type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'QUERY' | 'TRACE'

/**
 * The OpenAPI query style. `form` is the default.
 */
export type QueryStyle = 'form' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'

export type SerializationStyle<TStyle = string> = {
  style?: TStyle
  explode?: boolean
  allowReserved?: boolean
}

/**
 * The media type of a parameter described with `content`. JSON sends one JSON-encoded value.
 */
export type ParamContentType = {
  contentType?: string
}

/**
 * `querystring` marks an OpenAPI 3.2 `in: querystring` parameter, sent as the whole query string.
 */
export type QueryParamStyle = SerializationStyle<QueryStyle> & ParamContentType & { querystring?: boolean }

/**
 * Turns the query object into a search string, following each parameter's OpenAPI style when given.
 */
export type QuerySerializer = (params: Record<string, unknown>, options?: Record<string, QueryParamStyle>) => string

/**
 * `cookie` is the OpenAPI 3.2 style that sends values as they are, without percent-encoding (RFC 6265). `form` is the default.
 */
export type CookieParamStyle = ParamContentType & {
  style?: 'form' | 'cookie'
  explode?: boolean
}

export type HeaderParamStyle = ParamContentType & {
  explode?: boolean
}

/**
 * The OpenAPI `encoding` of one form body property. `contentType` sets a multipart part's media type.
 */
export type BodyEncoding = SerializationStyle<QueryStyle> & {
  contentType?: string
}

/**
 * The OpenAPI path style. `simple` is the default.
 */
export type PathStyle = 'simple' | 'label' | 'matrix'

export type PathParamStyle = SerializationStyle<PathStyle>

/**
 * Turns one path parameter into its URL segment.
 */
export type PathSerializer = (args: { name: string; value: unknown; options?: PathParamStyle }) => string

/**
 * Parameter serializers, set per client or per call. Bodies are encoded by `mediaTypes`.
 */
export type Serializers = {
  query?: QuerySerializer
  path?: PathSerializer
}

/**
 * The OpenAPI styles of a generated call's parameters, by location and name. `body` holds the form `encoding`.
 */
export type Styles = {
  path?: Record<string, PathParamStyle>
  query?: Record<string, QueryParamStyle>
  header?: Record<string, HeaderParamStyle>
  cookie?: Record<string, CookieParamStyle>
  body?: Record<string, BodyEncoding>
}

/**
 * Sends a `bigint` as a JSON number, and throws past the safe-integer range instead of losing precision.
 */
export function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value !== 'bigint') return value
  if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)
    throw new TypeError(`Cannot serialize ${value}n as JSON without losing precision, register a media type to send it another way.`)
  return Number(value)
}

export function serializeUrlencodedBody(body: Record<string, unknown>, encoding: Record<string, BodyEncoding>): string {
  const parts: Array<string> = []
  for (const [key, value] of Object.entries(body)) {
    const propertyEncoding = encoding[key]
    // OpenAPI ignores `contentType` once a style field is set.
    const styled = propertyEncoding?.style !== undefined || propertyEncoding?.explode !== undefined || propertyEncoding?.allowReserved !== undefined
    if (notNullish(value) && !styled && isJsonMediaType(propertyEncoding?.contentType)) {
      parts.push(`${encodeComponent(key)}=${encodeComponent(JSON.stringify(value, jsonReplacer))}`)
      continue
    }
    parts.push(...(propertyEncoding ? serializeStyledQueryParam({ key, value, options: propertyEncoding }) : serializeDefaultQueryParam(key, value)))
  }
  return parts.join('&')
}

/**
 * A `Content-Type` without its parameters, in lower case.
 */
export function baseContentType(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value.split(';')[0]!.trim().toLowerCase() || undefined
}

function isJsonMediaType(contentType: string | null | undefined): boolean {
  return /[/+]json$/.test(baseContentType(contentType) ?? '')
}

/**
 * An RFC 6265 cookie value, which the `cookie` style sends without escaping.
 */
const cookieOctets = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/

function rawCookieValue(item: unknown): string {
  const value = toValue(item)
  // An unescaped `;` would add a cookie of its own.
  if (!cookieOctets.test(value)) throw new TypeError(`Cookie value ${JSON.stringify(value)} has characters the cookie style cannot send, escape it first.`)
  return value
}

function serializeCookie({ name, value, explode, raw }: { name: string; value: unknown; explode: boolean; raw: boolean }): string {
  const encode = (item: unknown) => (raw ? rawCookieValue(item) : encodeURIComponent(toValue(item)))
  if (Array.isArray(value)) {
    const items = value.filter(notNullish).map(encode)
    return explode ? items.map((item) => `${name}=${item}`).join('; ') : `${name}=${items.join(',')}`
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, item]) => notNullish(item))
    if (explode) return entries.map(([key, item]) => `${key}=${encode(item)}`).join('; ')
    return `${name}=${entries
      .flatMap(([key, item]) => [key, item])
      .map(encode)
      .join(',')}`
  }
  return `${name}=${encode(value)}`
}

/**
 * Joins cookie parameters into a `Cookie` header value with the OpenAPI `form` style, or the `cookie` style when a parameter sets it.
 */
export function serializeCookies(cookies: Record<string, unknown>, styles?: Record<string, CookieParamStyle>): string {
  const parts: Array<string> = []
  for (const [name, value] of Object.entries(cookies)) {
    if (value === undefined || value === null) continue
    const style = styles?.[name]
    if (isJsonMediaType(style?.contentType)) {
      parts.push(`${name}=${encodeURIComponent(JSON.stringify(value, jsonReplacer))}`)
      continue
    }
    // OpenAPI 3.2 defaults `explode` to true for the `cookie` style.
    const raw = style?.style === 'cookie'
    parts.push(serializeCookie({ name, value, explode: style?.explode ?? raw, raw }))
  }
  return parts.join('; ')
}

function appendQueryValue({ search, key, value }: { search: URLSearchParams; key: string; value: unknown }): void {
  if (value === undefined || value === null) return
  if (Array.isArray(value)) {
    for (const item of value) appendQueryValue({ search, key, value: item })
    return
  }
  if (isRecord(value)) {
    for (const [prop, propValue] of Object.entries(value)) {
      appendQueryValue({ search, key: `${key}[${prop}]`, value: propValue })
    }
    return
  }
  search.append(key, toValue(value))
}

const queryDelimiters: Record<QueryStyle, string> = { form: ',', spaceDelimited: '%20', pipeDelimited: '|', deepObject: ',' }

function notNullish(value: unknown): boolean {
  return value !== undefined && value !== null
}

/**
 * Renders a parameter value as a string. A `Date` becomes ISO-8601, so it does not depend on the locale.
 */
export function toValue(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

// `allowReserved` keeps reserved characters, but `#`, `&`, and `+` would end the query or change a form value.
function encodeReserved(value: unknown): string {
  return encodeURI(toValue(value)).replace(/[#&+]/g, encodeURIComponent)
}

function encodeComponent(value: unknown): string {
  return encodeURIComponent(toValue(value))
}

// A `Date` is a unit, not an object to expand.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

function serializeDeepObject({ key, value, encode }: { key: string; value: unknown; encode: (value: unknown) => string }): Array<string> {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.flatMap((item, index) => serializeDeepObject({ key: `${key}[${index}]`, value: item, encode }))
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([, item]) => notNullish(item))
      .flatMap(([prop, item]) => serializeDeepObject({ key: `${key}[${prop}]`, value: item, encode }))
  }
  return [`${encode(key)}=${encode(value)}`]
}

function serializeStyledQueryArray({
  key,
  value,
  options,
  encode,
}: {
  key: string
  value: Array<unknown>
  options: QueryParamStyle
  encode: (value: unknown) => string
}): Array<string> {
  const items = value.filter(notNullish)
  if (options.explode ?? true) return items.map((item) => `${encode(key)}=${encode(item)}`)
  return [`${encode(key)}=${items.map(encode).join(queryDelimiters[options.style ?? 'form'])}`]
}

function serializeStyledQueryObject({
  key,
  value,
  options,
  encode,
}: {
  key: string
  value: Record<string, unknown>
  options: QueryParamStyle
  encode: (value: unknown) => string
}): Array<string> {
  if ((options.style ?? 'form') === 'deepObject') return serializeDeepObject({ key, value, encode })
  const entries = Object.entries(value).filter(([, item]) => notNullish(item))
  if (options.explode ?? true) return entries.map(([prop, item]) => `${encode(prop)}=${encode(item)}`)
  return [
    `${encode(key)}=${entries
      .flatMap(([prop, item]) => [prop, item])
      .map(encode)
      .join(',')}`,
  ]
}

function serializeStyledQueryParam({ key, value, options }: { key: string; value: unknown; options: QueryParamStyle }): Array<string> {
  if (value === undefined || value === null) return []
  const encode = options.allowReserved ? encodeReserved : encodeComponent
  // OpenAPI leaves arrays under deepObject undefined. Objects in one are indexed, `items[0][price]=p`, as nested arrays are.
  if (Array.isArray(value) && options.style === 'deepObject' && value.some(isRecord)) return serializeDeepObject({ key, value, encode })
  if (Array.isArray(value)) return serializeStyledQueryArray({ key, value, options, encode })
  if (isRecord(value)) return serializeStyledQueryObject({ key, value, options, encode })
  return [`${encode(key)}=${encode(value)}`]
}

function serializeDefaultQueryParam(key: string, value: unknown): Array<string> {
  const search = new URLSearchParams()
  appendQueryValue({ search, key, value })
  const result = search.toString()
  return result ? [result] : []
}

/**
 * The default query serializer. Without a style, arrays repeat their key and objects use the OpenAPI default, `form` with
 * explode, so `{ a: 1, b: 2 }` becomes `a=1&b=2`.
 */
export const defaultQuerySerializer: QuerySerializer = (params, options) => {
  const parts: Array<string> = []
  for (const [key, value] of Object.entries(params)) {
    const paramOptions = options?.[key]
    if (notNullish(value) && isJsonMediaType(paramOptions?.contentType)) {
      const json = encodeComponent(JSON.stringify(value, jsonReplacer))
      parts.push(paramOptions?.querystring ? json : `${encodeComponent(key)}=${json}`)
      continue
    }
    const styled = paramOptions ?? (isRecord(value) ? {} : undefined)
    // `URLSearchParams` writes a space as `+`, form encoding for bodies. A query follows RFC 6570, as a styled one does: `%20`.
    parts.push(
      ...(styled
        ? serializeStyledQueryParam({ key, value, options: styled })
        : serializeDefaultQueryParam(key, value).map((part) => part.replaceAll('+', '%20'))),
    )
  }
  return parts.join('&')
}

function serializePathPrimitive({ name, value, style }: { name: string; value: unknown; style: PathStyle }): string {
  const encoded = encodeComponent(value)
  if (style === 'label') return `.${encoded}`
  if (style === 'matrix') return `;${name}=${encoded}`
  return encoded
}

function serializePathArray({ name, value, style, explode }: { name: string; value: Array<unknown>; style: PathStyle; explode: boolean }): string {
  const items = value.map(encodeComponent)
  if (style === 'label') return `.${items.join(explode ? '.' : ',')}`
  if (style === 'matrix') return explode ? items.map((item) => `;${name}=${item}`).join('') : `;${name}=${items.join(',')}`
  return items.join(',')
}

function serializePathObject({ name, value, style, explode }: { name: string; value: Record<string, unknown>; style: PathStyle; explode: boolean }): string {
  const members = Object.entries(value).map(([key, item]) =>
    explode ? `${encodeComponent(key)}=${encodeComponent(item)}` : `${encodeComponent(key)},${encodeComponent(item)}`,
  )
  if (style === 'label') return `.${members.join(explode ? '.' : ',')}`
  if (style === 'matrix') return explode ? members.map((member) => `;${member}`).join('') : `;${name}=${members.join(',')}`
  return members.join(',')
}

/**
 * The default path serializer. Without a style, it uses `simple` without `explode`.
 */
export const defaultPathSerializer: PathSerializer = ({ name, value, options }) => {
  if (value === undefined || value === null) return ''
  const style = options?.style ?? 'simple'
  const explode = options?.explode ?? false
  if (Array.isArray(value)) return serializePathArray({ name, value, style, explode })
  if (isRecord(value)) return serializePathObject({ name, value, style, explode })
  return serializePathPrimitive({ name, value, style })
}

function serializeHeaderValue(value: unknown, explode: boolean): string {
  if (Array.isArray(value)) return value.filter(notNullish).map(toValue).join(',')
  if (!isRecord(value)) return toValue(value)
  const entries = Object.entries(value).filter(([, item]) => notNullish(item))
  if (explode) return entries.map(([key, item]) => `${key}=${toValue(item)}`).join(',')
  return entries
    .flatMap(([key, item]) => [key, item])
    .map(toValue)
    .join(',')
}

// Header values must be Latin-1, so non-ASCII characters become JSON escapes.
function toAsciiJson(value: unknown): string {
  return JSON.stringify(value, jsonReplacer).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

/**
 * Serializes array and object headers with the OpenAPI `simple` style.
 */
export function applyHeaderStyles(headers: HeadersInit | undefined, styles: Record<string, HeaderParamStyle> | undefined): HeadersInit | undefined {
  // A `Headers` instance only holds strings, so there is nothing to style.
  if (!headers || headers instanceof Headers) return headers
  const entries = Array.isArray(headers) ? headers : Object.entries(headers)
  return entries.map(([key, value]) => {
    // Without an entry the parameter uses the OpenAPI default: `simple`, no explode.
    const style = styles?.[key] ?? {}
    if (value === undefined || value === null) return [key, value] as [string, HeaderValue]
    if (isJsonMediaType(style.contentType)) return [key, toAsciiJson(value)] as [string, HeaderValue]
    if (typeof value !== 'object') return [key, value] as [string, HeaderValue]
    return [key, serializeHeaderValue(value, style.explode ?? false)] as [string, HeaderValue]
  })
}
