import { isEncodedBody, parseJson } from '../mediaTypes.ts'
import type { MediaType } from '../mediaTypes.ts'
import { isJsonMediaType, jsonReplacer } from '../serializers.ts'
import type { PartsEncoding } from '../serializers.ts'

function isBinaryPart(part: unknown): part is Blob | BufferSource {
  return part instanceof Blob || part instanceof ArrayBuffer || ArrayBuffer.isView(part)
}

function defaultPartType(part: unknown, binary: boolean): string {
  if (binary) return (part instanceof Blob && part.type) || 'application/octet-stream'
  return typeof part === 'string' ? 'text/plain' : 'application/json'
}

function toMultipartMixed(parts: Array<unknown>, encoding: PartsEncoding | undefined): Blob {
  // `crypto.randomUUID` needs a secure context, `getRandomValues` works on plain http too.
  const boundary = `kubb-${Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  const chunks: Array<BlobPart> = []
  parts.forEach((part, index) => {
    // `JSON.stringify(undefined)` is not JSON. Skipping the part keeps the `prefixEncoding` indexes of the rest.
    if (part === undefined) return
    // An Encoding `contentType` can list several types, such as `image/png, image/jpeg`. A part sends the first.
    const declared = (encoding?.prefix?.[index] ?? encoding?.item)?.contentType?.split(',')[0]!.trim()
    const binary = isBinaryPart(part)
    const contentType = declared ?? defaultPartType(part, binary)
    const value = binary || (typeof part === 'string' && !isJsonMediaType(declared)) ? part : JSON.stringify(part, jsonReplacer)
    chunks.push(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`, value, '\r\n')
  })
  chunks.push(`--${boundary}--\r\n`)
  return new Blob(chunks, { type: `multipart/mixed; boundary=${boundary}` })
}

async function fromMultipartMixed(response: Response): Promise<Array<unknown>> {
  const boundary = /boundary="?([^";]+)"?/i.exec(response.headers.get('content-type') ?? '')?.[1]
  if (!boundary) throw new TypeError('Expected a boundary in the Content-Type of a multipart/mixed response')
  // shortcut: parts are read as text, so a binary part does not keep its bytes; read the bytes when a spec returns one.
  // RFC 2046: a delimiter is `--boundary` at the start of a line, so the same text inside a part does not split it.
  const delimiter = new RegExp(`(?:^|\\r?\\n)--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  const sections = (await response.text()).split(delimiter).slice(1, -1)
  return sections.map((section) => {
    const [, head = '', body = ''] = /^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/.exec(section) ?? []
    // The delimiter already took the line break before the next boundary, so the body keeps its own trailing newline.
    const contentType = /^content-type:\s*([^;\r\n]+)/im.exec(head)?.[1]?.trim()
    return isJsonMediaType(contentType) ? parseJson(body, contentType) : body
  })
}

/**
 * The `multipart/mixed` handler, which follows `config.styles.parts`.
 */
export const multipartMixed: MediaType = {
  encode: (body, { config }) => (isEncodedBody(body) ? body : toMultipartMixed(Array.isArray(body) ? body : [body], config.styles?.parts)),
  decode: fromMultipartMixed,
}
