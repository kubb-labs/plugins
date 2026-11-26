import { ast, type ContentNode, type SchemaNode } from '@kubb/ast'

export type MediaTypeInput = string | { contentType: string }

const streamMediaTypes = new Set(['application/jsonl', 'application/x-ndjson', 'application/json-seq', 'text/event-stream'])

export const getBase = ast.mediaType.getBase
export const isJson = ast.mediaType.isJson

/** Whether the media type is a stream of items: SSE, JSON Lines, or a `+json-seq` sequence. */
export function isStream(mediaType: MediaTypeInput): boolean {
  const baseType = getBase(mediaType)
  return streamMediaTypes.has(baseType) || (baseType.startsWith('application/') && baseType.endsWith('+json-seq'))
}

export type ContentEntry = { contentType: string; schema?: Pick<SchemaNode, 'type'> | null; stream?: ContentNode['stream'] }

const formKinds: Record<string, 'form' | 'urlencoded'> = { 'multipart/form-data': 'form', 'application/x-www-form-urlencoded': 'urlencoded' }

export type MediaKind = 'json' | 'form' | 'urlencoded' | 'text' | 'binary' | 'eventStream' | 'lineStream'

/** How a client reads or sends a content entry, or `null` for another media type. A `blob` schema is `binary`. */
export function getKind(entry: string | ContentEntry): MediaKind | null {
  const content = typeof entry === 'string' ? { contentType: entry } : entry
  const baseType = getBase(content)
  if (!baseType) return null
  if (baseType === 'text/event-stream') return 'eventStream'
  // `multipart/mixed` with an `itemSchema` also has `stream`, but it is a stream of parts, not of JSON values.
  if (content.stream && isStream(content)) return 'lineStream'
  if (isJson(baseType)) return 'json'
  if (formKinds[baseType]) return formKinds[baseType]
  if (content.schema?.type === 'blob') return 'binary'
  if (baseType.startsWith('text/')) return 'text'
  if (baseType === 'application/octet-stream' || baseType === 'application/pdf' || /^(image|audio|video)\//.test(baseType)) return 'binary'
  return null
}
