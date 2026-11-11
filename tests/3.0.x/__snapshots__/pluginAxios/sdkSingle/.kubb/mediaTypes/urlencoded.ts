import type { MediaType } from '../mediaTypes'
import { isEncodedBody } from '../mediaTypes'
import { serializeUrlencodedBody } from '../serializers'

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
