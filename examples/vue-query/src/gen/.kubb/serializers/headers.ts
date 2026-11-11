import type { HeaderSerializer, HeaderValue } from '../serializers'
import { isJsonMediaType, isRecord, jsonReplacer, notNullish, toValue } from '../serializers'

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

/** Serializes array and object headers with the OpenAPI `simple` style. */
export const applyHeaderStyles: HeaderSerializer = (headers, styles) => {
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
