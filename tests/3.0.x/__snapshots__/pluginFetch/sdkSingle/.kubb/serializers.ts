export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>

/**
 * A body `fetch` accepts, read from `RequestInit` so a project without the `dom` lib still has it.
 */
export type RequestBody = NonNullable<RequestInit['body']>

export type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'QUERY' | 'TRACE' | (string & {})

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
 * Joins the cookie parameters of a call into a `Cookie` header value.
 */
export type CookieSerializer = (cookies: Record<string, unknown>, styles?: Record<string, CookieParamStyle>) => string

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
  /**
   * Sends the `cookies` of a call. Kubb registers `serializeCookies` when the spec has a cookie parameter.
   */
  cookie?: CookieSerializer
}

/**
 * The OpenAPI 3.2 `prefixEncoding` (by position) and `itemEncoding` (the rest) of a `multipart/mixed` body's parts.
 */
export type PartsEncoding = {
  prefix?: Array<{ contentType?: string }>
  item?: { contentType?: string }
}

/**
 * The OpenAPI styles of a generated call's parameters, by location and name. `body` holds the form `encoding`, and
 * `parts` the encoding of a `multipart/mixed` body's parts.
 */
export type Styles = {
  path?: Record<string, PathParamStyle>
  query?: Record<string, QueryParamStyle>
  header?: Record<string, HeaderParamStyle>
  cookie?: Record<string, CookieParamStyle>
  body?: Record<string, BodyEncoding>
  parts?: PartsEncoding
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

/**
 * A `Content-Type` without its parameters, in lower case.
 */
export function baseContentType(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value.split(';')[0]!.trim().toLowerCase() || undefined
}

/**
 * Whether a media type is JSON, such as `application/json` or `application/problem+json`.
 */
export function isJsonMediaType(contentType: string | null | undefined): boolean {
  return /[/+]json$/.test(baseContentType(contentType) ?? '')
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

export function notNullish(value: unknown): boolean {
  return value !== undefined && value !== null
}

/**
 * Renders a parameter value as a string. A `Date` becomes ISO-8601, so it does not depend on the locale.
 */
export function toValue(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

export function encodeComponent(value: unknown): string {
  return encodeURIComponent(toValue(value))
}

// A `Date` is a unit, not an object to expand.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

/**
 * One parameter as form pairs, with an array repeating its key and an object as `key[prop]`.
 */
export function serializeDefaultQueryParam(key: string, value: unknown): Array<string> {
  const search = new URLSearchParams()
  appendQueryValue({ search, key, value })
  const result = search.toString()
  return result ? [result] : []
}

/**
 * The default query serializer, for parameters without a style: arrays repeat their key and objects use the OpenAPI
 * default, `form` with explode, so `{ a: 1, b: 2 }` becomes `a=1&b=2`. Kubb registers `serializeQuery` when the spec
 * has a styled query parameter.
 */
export const defaultQuerySerializer: QuerySerializer = (params, options) => {
  const parts: Array<string> = []
  for (const [key, value] of Object.entries(params)) {
    if (options?.[key]) throw new TypeError(`Cannot send query parameter ${key} with a style, register serializer.query on the client.`)
    // `URLSearchParams` writes a space as `+`, form encoding for bodies. A query follows RFC 6570: `%20`.
    parts.push(
      ...(isRecord(value)
        ? Object.entries(value)
            .filter(([, item]) => notNullish(item))
            .map(([prop, item]) => `${encodeComponent(prop)}=${encodeComponent(item)}`)
        : serializeDefaultQueryParam(key, value).map((part) => part.replaceAll('+', '%20'))),
    )
  }
  return parts.join('&')
}

/**
 * The default path serializer, for the `simple` style. Kubb registers `serializePath` when the spec has a `label` or
 * `matrix` parameter.
 */
export const defaultPathSerializer: PathSerializer = ({ name, value, options }) => {
  if (value === undefined || value === null) return ''
  if (options?.style && options.style !== 'simple') {
    throw new TypeError(`Cannot send path parameter ${name} with the ${options.style} style, register serializer.path on the client.`)
  }
  if (Array.isArray(value)) return value.map(encodeComponent).join(',')
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${encodeComponent(key)}${options?.explode ? '=' : ','}${encodeComponent(item)}`)
      .join(',')
  }
  return encodeComponent(value)
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
