import { isEncodedBody } from '../mediaTypes.ts'
import type { MediaType } from '../mediaTypes.ts'
import { serializeUrlencodedBody } from '../serializers.ts'

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
