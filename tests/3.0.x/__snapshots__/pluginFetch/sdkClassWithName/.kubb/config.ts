import type { ClientConfig } from './core'
import { urlencoded } from './mediaTypes/urlencoded'
import { serializeHeaders } from './serializers/headers'
import { serializePath } from './serializers/path'
import { serializeStyledQuery } from './serializers/queryStyles'

/**
 * The config `client.ts` starts with: what this spec needs from the runtime.
 */
export const defaultConfig: ClientConfig = { mediaTypes: { 'application/x-www-form-urlencoded': urlencoded }, serializer: { query: serializeStyledQuery, path: serializePath, header: serializeHeaders } }
