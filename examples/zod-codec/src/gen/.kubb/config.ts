import type { ClientConfig } from './core.ts'
import { serializeHeaders } from './serializers/headers.ts'
import { serializePath } from './serializers/path.ts'
import { serializeQuery } from './serializers/query.ts'

/**
 * The config `client.ts` starts with: what this spec needs from the runtime.
 */
export const defaultConfig: ClientConfig = { serializer: { query: serializeQuery, path: serializePath, header: serializeHeaders } }
