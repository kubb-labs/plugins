import type { ClientConfig } from './core'
import { multipartFormData } from './mediaTypes/formData'
import { urlencoded } from './mediaTypes/urlencoded'
import { serializeHeaders } from './serializers/headers'
import { serializePath } from './serializers/path'
import { serializeStyledQuery } from './serializers/queryStyles'

/**
 * The config `client.ts` starts with: what this spec needs from the runtime.
 */
export const defaultConfig: ClientConfig = {
  baseURL: 'https://petstore.swagger.io/v2',
  mediaTypes: { 'application/x-www-form-urlencoded': urlencoded, 'multipart/form-data': multipartFormData },
  serializer: { query: serializeStyledQuery, path: serializePath, header: serializeHeaders },
}
