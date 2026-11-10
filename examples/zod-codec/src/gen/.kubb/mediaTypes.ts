import type { EventStreamOptions, RequestConfig } from './core.ts'
import type { BodyEncoding, PartsEncoding, RequestBody } from './serializers.ts'
import { baseContentType, jsonReplacer, serializeUrlencodedBody, toValue } from './serializers.ts'
import { ParseError } from './standardSchema.ts'

/**
 * What a media type handler gets next to the body.
 */
export type MediaTypeContext = {
  contentType: string
  /**
   * The response status, or `undefined` while a request body is encoded.
   */
  status?: number
  signal?: AbortSignal
  config: Omit<RequestConfig, 'client' | 'transport'> & EventStreamOptions
  /**
   * Where a stream records the last event ID it read, for `StreamResult.lastEventId`.
   */
  cursor?: { lastEventId: string }
}

/**
 * Encodes and decodes bodies of one media type. Every method is optional.
 */
export type MediaType = {
  encode?: (body: unknown, context: MediaTypeContext) => RequestBody | undefined
  decode?: (response: Response, context: MediaTypeContext) => unknown
  /**
   * Reads a 2xx body item by item. Each item is validated with `validator.response`.
   */
  stream?: (body: ReadableStream<Uint8Array>, context: MediaTypeContext) => AsyncIterable<unknown>
}

/**
 * Handlers keyed by media type. A key may be a pattern such as `application/*+json` or `text/*`.
 */
export type MediaTypes = Record<string, MediaType>

/**
 * Picks the handler for a `Content-Type`: the exact type, then its `+suffix`, then `type/*`, then the catch-all. With `use`, a
 * handler without that method is skipped.
 */
export function resolveMediaType({
  mediaTypes,
  contentType,
  use,
}: {
  mediaTypes: MediaTypes
  contentType: string | null | undefined
  use?: keyof MediaType
}): MediaType | undefined {
  const base = baseContentType(contentType)
  const [type, subtype = ''] = base?.split('/') ?? []
  const suffix = subtype.includes('+') ? subtype.slice(subtype.lastIndexOf('+')) : undefined
  const keys = base ? [base, suffix ? `${type}/*${suffix}` : undefined, `${type}/*`, '*/*'] : ['*/*']
  for (const key of keys) {
    const mediaType = key ? mediaTypes[key] : undefined
    if (mediaType && (!use || mediaType[use])) return mediaType
  }
  return undefined
}

/**
 * Whether a body is already encoded, so every built-in media type sends it as is.
 */
export function isEncodedBody(body: unknown): body is RequestBody {
  return (
    typeof body === 'string' ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ReadableStream
  )
}

function encodeOrJson(body: unknown, { contentType }: MediaTypeContext): RequestBody {
  if (isEncodedBody(body)) return body
  // XML, YAML, and CSV are never JSON, so a value for one must not go out as JSON under its label.
  const mediaType = baseContentType(contentType)
  if (mediaType && /[/+](xml|yaml|x-yaml|csv)$/.test(mediaType)) {
    throw new TypeError(`Cannot encode the body as ${mediaType}, register mediaTypes['${mediaType}'].encode or pass the encoded body as a string.`)
  }
  return JSON.stringify(body, jsonReplacer)
}

const json: MediaType = {
  // A string is JSON-encoded too, so it arrives as a JSON string.
  encode: (body) => (isEncodedBody(body) && typeof body !== 'string' ? body : JSON.stringify(body, jsonReplacer)),
  decode: async (response, { contentType }) => {
    const text = await response.text()
    if (!text) return undefined
    try {
      return JSON.parse(text)
    } catch (error) {
      // `cause` is assigned, since the constructor option needs the ES2022 library.
      throw Object.assign(new ParseError({ message: `Invalid JSON in a ${baseContentType(contentType)} body`, issues: [{ message: String(error) }] }), {
        cause: error,
      })
    }
  },
}

const text: MediaType = {
  encode: encodeOrJson,
  decode: async (response) => (await response.text()) || undefined,
}

const binary: MediaType = {
  encode: encodeOrJson,
  decode: (response) => response.blob(),
}

const catchAll: MediaType = {
  encode: encodeOrJson,
  // A server may label a plain message such as `Pet deleted` with any type, so non-JSON stays text.
  decode: async (response) => {
    const body = await response.text()
    if (!body) return undefined
    try {
      return JSON.parse(body)
    } catch {
      return body
    }
  },
}

function appendFormDataValue({ formData, key, value, contentType }: { formData: FormData; key: string; value: unknown; contentType?: string }): void {
  if (value === undefined || value === null) return
  if (value instanceof Blob) {
    formData.append(key, value)
    return
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    const encoded = JSON.stringify(value, jsonReplacer)
    // A part's media type can only be set by wrapping the value in a typed Blob.
    formData.append(key, contentType ? new Blob([encoded], { type: contentType }) : encoded)
    return
  }
  formData.append(key, toValue(value))
}

const formDelimiters: Partial<Record<string, string>> = { spaceDelimited: ' ', pipeDelimited: '|' }

function toFormData(body: Record<string, unknown>, encoding: Record<string, BodyEncoding> | undefined): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(body)) {
    const { contentType, style, explode } = encoding?.[key] ?? {}
    // `explode: false` sends an array of scalars as one part, its items joined by the style's delimiter.
    if (Array.isArray(value) && explode === false && value.every((item) => typeof item !== 'object' || item === null || item instanceof Date)) {
      const delimiter = formDelimiters[style ?? 'form'] ?? ','
      formData.append(
        key,
        value
          .filter((item) => item !== undefined && item !== null)
          .map(toValue)
          .join(delimiter),
      )
      continue
    }
    for (const item of Array.isArray(value) ? value : [value]) appendFormDataValue({ formData, key, value: item, contentType })
  }
  return formData
}

const multipart: MediaType = {
  encode: (body, { config }) => (isEncodedBody(body) ? body : toFormData(body as Record<string, unknown>, config.styles?.body)),
  decode: (response) => response.formData(),
}

/**
 * Encodes an array as `multipart/mixed` parts (RFC 2046). A part's media type comes from `encoding`, by position in
 * `prefix` and then `item`, else from the part: a `Blob`'s own type, `text/plain` for a string, JSON for anything else.
 * The boundary goes on the `Blob`'s type, which the client sends as `Content-Type`.
 */
function toMultipartMixed(parts: Array<unknown>, encoding: PartsEncoding | undefined): Blob {
  const boundary = `kubb-${crypto.randomUUID()}`
  const chunks: Array<BlobPart> = []
  parts.forEach((part, index) => {
    const declared = (encoding?.prefix?.[index] ?? encoding?.item)?.contentType
    const contentType =
      declared ?? (part instanceof Blob ? part.type || 'application/octet-stream' : typeof part === 'string' ? 'text/plain' : 'application/json')
    const value = part instanceof Blob || typeof part === 'string' ? part : JSON.stringify(part, jsonReplacer)
    chunks.push(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`, value, '\r\n')
  })
  chunks.push(`--${boundary}--\r\n`)
  return new Blob(chunks, { type: `multipart/mixed; boundary=${boundary}` })
}

const mixed: MediaType = {
  encode: (body, { config }) => (isEncodedBody(body) ? body : toMultipartMixed(Array.isArray(body) ? body : [body], config.styles?.parts)),
}

const urlencoded: MediaType = {
  encode: (body, { config }) => {
    if (isEncodedBody(body)) return body
    const encoding = config.styles?.body
    const encoded = serializeUrlencodedBody(body as Record<string, unknown>, encoding ?? {})
    return encoding ? encoded : new URLSearchParams(encoded)
  },
  decode: (response) => response.formData(),
}

/**
 * The media types every client knows: JSON, text, binary, and a catch-all that sends JSON and reads JSON or text.
 */
export const defaultMediaTypes: MediaTypes = {
  'application/json': json,
  'application/*+json': json,
  'text/json': json,
  'text/*': text,
  'application/octet-stream': binary,
  'application/pdf': binary,
  'image/*': binary,
  'audio/*': binary,
  'video/*': binary,
  '*/*': catchAll,
}

/**
 * The `multipart/form-data` and `application/x-www-form-urlencoded` handlers, which follow `config.styles.body`, and the
 * `multipart/mixed` one, which follows `config.styles.parts`.
 */
export const formMediaTypes: MediaTypes = {
  'multipart/form-data': multipart,
  'multipart/mixed': mixed,
  'application/x-www-form-urlencoded': urlencoded,
}
