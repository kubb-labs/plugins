import type { EventStreamOptions, RequestConfig } from './core.ts'
import type { BodyEncoding, RequestBody } from './serializers.ts'
import { baseContentType, jsonReplacer, serializeUrlencodedBody } from './serializers.ts'
import { ParseError } from './standardSchema.ts'

/**
 * What a media type handler gets next to the body.
 */
export type MediaTypeContext = {
  /** The full `Content-Type` header, parameters such as `charset` included. */
  contentType: string
  /** The response status, or `undefined` while a request body is encoded. */
  status?: number
  signal?: AbortSignal
  /** The call's config, with the stream options `maxEventSize`, `terminator`, `transform`, and `eventShape`. */
  config: Omit<RequestConfig, 'client' | 'transport'> & EventStreamOptions
  /** Where a stream records the last event ID it has read, which `StreamResult.lastEventId` returns. */
  cursor?: { lastEventId: string }
}

/**
 * Turns a body into bytes and back for one media type. Every method is optional.
 */
export type MediaType = {
  /** Encodes a request body sent with this media type. */
  encode?: (body: unknown, context: MediaTypeContext) => RequestBody | undefined
  /** Decodes a whole response body. It gets the `Response`, so a binary format can read bytes. */
  decode?: (response: Response, context: MediaTypeContext) => unknown
  /** Reads a 2xx body item by item. The core validates each item with `validator.response`. */
  stream?: (body: ReadableStream<Uint8Array>, context: MediaTypeContext) => AsyncIterable<unknown>
}

/**
 * Media type handlers keyed by media type. A key may be a pattern: `application/*+json`, `text/*`, or `*` + `/*`.
 */
export type MediaTypes = Record<string, MediaType>

/**
 * Picks the handler for a `Content-Type`. The header loses its parameters and is lower-cased, then the keys are tried in
 * order: the exact type, its structured suffix such as `application/*+json`, its type wildcard such as `text/*`, and
 * `*` + `/*`. With `use`, a handler without that method is skipped, so an XML entry with only `decode` still encodes
 * through the catch-all.
 *
 * @example
 * ```ts
 * resolveMediaType({ mediaTypes: defaultMediaTypes, contentType: 'application/problem+json; charset=utf-8' }) // the JSON handler
 * ```
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

/** A body the caller already encoded, which every built-in media type sends as is. */
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

/** Sends an encoded body as is and JSON-encodes anything else, except under a media type that is never JSON. */
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
      // `cause` is assigned, since the constructor option needs the ES2022 library a generated client cannot assume.
      throw Object.assign(new ParseError({ message: `Invalid JSON in a ${baseContentType(contentType)} body`, issues: [{ message: String(error) }] }), {
        cause: error,
      })
    }
  },
}

const text: MediaType = {
  encode: encodeOrJson,
  // An empty body is no data, as it is for every other media type.
  decode: async (response) => (await response.text()) || undefined,
}

const binary: MediaType = {
  encode: encodeOrJson,
  decode: (response) => response.blob(),
}

const any: MediaType = {
  encode: encodeOrJson,
  // A body that is not JSON stays text, since a server may label a plain message such as `Pet deleted` with any type.
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

/** Dates are sent as ISO-8601, so they are stable across locales. */
function toFormValue(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value)
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
  formData.append(key, toFormValue(value))
}

function toFormData(body: Record<string, unknown>, encoding: Record<string, BodyEncoding> | undefined): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(body)) {
    const contentType = encoding?.[key]?.contentType
    for (const item of Array.isArray(value) ? value : [value]) appendFormDataValue({ formData, key, value: item, contentType })
  }
  return formData
}

const multipart: MediaType = {
  encode: (body, { config }) => (isEncodedBody(body) ? body : toFormData(body as Record<string, unknown>, config.styles?.body)),
  decode: (response) => response.formData(),
}

const urlencoded: MediaType = {
  // With `encoding`, each property follows its OpenAPI `style`, `explode`, and `allowReserved`.
  encode: (body, { config }) => {
    if (isEncodedBody(body)) return body
    const encoding = config.styles?.body
    const encoded = serializeUrlencodedBody(body as Record<string, unknown>, encoding ?? {})
    return encoding ? encoded : new URLSearchParams(encoded)
  },
  decode: (response) => response.formData(),
}

/**
 * The media types every client knows: JSON, text, binary, and a `*` + `/*` catch-all that sends JSON and reads JSON or text.
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
  '*/*': any,
}

/**
 * `multipart/form-data` and `application/x-www-form-urlencoded`. The generated client registers them only when the
 * document has a form body. A form body follows the OpenAPI `encoding` in `config.styles.body`.
 */
export const formMediaTypes: MediaTypes = {
  'multipart/form-data': multipart,
  'application/x-www-form-urlencoded': urlencoded,
}
