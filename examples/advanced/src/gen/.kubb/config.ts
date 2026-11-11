import { multipartFormData } from './mediaTypes/formData'
import { multipartMixed } from './mediaTypes/mixed'
import { urlencoded } from './mediaTypes/urlencoded'
import { serializeCookies } from './serializers/cookies'
import { serializeHeaders } from './serializers/headers'
import { serializePath } from './serializers/path'
import { serializeStyledQuery } from './serializers/queryStyles'
import { streamMediaTypes } from './sse'

/**
 * The config `client.ts` starts with: what this spec needs from the runtime.
 */
export const defaultConfig = {
  baseURL: 'https://petstore3.swagger.io/api/v3',
  mediaTypes: {
    'application/x-www-form-urlencoded': urlencoded,
    'multipart/form-data': multipartFormData,
    'multipart/mixed': multipartMixed,
    ...streamMediaTypes,
  },
  serializer: { query: serializeStyledQuery, path: serializePath, header: serializeHeaders, cookie: serializeCookies },
}
