import type { MediaType } from '../mediaTypes'
import type { BodyEncoding } from '../serializers'
import { isEncodedBody } from '../mediaTypes'
import { isJsonMediaType, jsonReplacer, serializeDefaultQueryParam } from '../serializers'
import { serializeStyledQueryParam } from '../serializers/queryStyles'

function serializeUrlencodedBody(body: Record<string, unknown>, encoding: Record<string, BodyEncoding>): string {
  const parts: Array<string> = []
  for (const [key, value] of Object.entries(body)) {
    const propertyEncoding = encoding[key]
    // OpenAPI ignores `contentType` once a style field is set.
    const styled = propertyEncoding?.style !== undefined || propertyEncoding?.explode !== undefined || propertyEncoding?.allowReserved !== undefined
    if (value !== undefined && value !== null && !styled && isJsonMediaType(propertyEncoding?.contentType)) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value, jsonReplacer))}`)
      continue
    }
    parts.push(...(propertyEncoding ? serializeStyledQueryParam({ key, value, options: propertyEncoding }) : serializeDefaultQueryParam(key, value)))
  }
  return parts.join('&')
}

/**
 * The `application/x-www-form-urlencoded` handler, which follows `config.styles.body`.
 */
export const urlencoded: MediaType = {
  encode: (body, { config }) => {
    if (isEncodedBody(body)) return body
    const encoding = config.styles?.body
    const encoded = serializeUrlencodedBody(body as Record<string, unknown>, encoding ?? {})
    return encoding ? encoded : new URLSearchParams(encoded)
  },
  decode: (response) => response.formData(),
}
