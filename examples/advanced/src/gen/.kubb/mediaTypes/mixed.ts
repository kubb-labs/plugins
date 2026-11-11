import type { MediaType } from '../mediaTypes'
import type { PartsEncoding } from '../serializers'
import { isEncodedBody } from '../mediaTypes'
import { isJsonMediaType, jsonReplacer } from '../serializers'

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
  const sections = (await response.text()).split(`--${boundary}`).slice(1, -1)
  return sections.map((section) => {
    const [, head = '', body = ''] = /^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/.exec(section) ?? []
    const value = body.replace(/\r?\n$/, '')
    return isJsonMediaType(/^content-type:\s*([^;\r\n]+)/im.exec(head)?.[1]?.trim()) ? JSON.parse(value) : value
  })
}

/**
 * The `multipart/mixed` handler, which follows `config.styles.parts`.
 */
export const multipartMixed: MediaType = {
  encode: (body, { config }) => (isEncodedBody(body) ? body : toMultipartMixed(Array.isArray(body) ? body : [body], config.styles?.parts)),
  decode: fromMultipartMixed,
}
