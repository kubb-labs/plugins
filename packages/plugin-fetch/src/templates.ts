import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { ClientTemplates } from '@internals/client'

const require = createRequire(import.meta.url)

/**
 * Absolute paths of the runtime files copied into `.kubb/`: this plugin's own `client.ts`, plus the shared runtime
 * `@kubb/plugin-client` ships for every client plugin.
 */
export const templates: ClientTemplates = {
  client: fileURLToPath(new URL('../templates/client.ts', import.meta.url)),
  core: require.resolve('@kubb/plugin-client/templates/core.ts'),
  mediaTypes: require.resolve('@kubb/plugin-client/templates/mediaTypes.ts'),
  serializers: require.resolve('@kubb/plugin-client/templates/serializers.ts'),
  standardSchema: require.resolve('@kubb/plugin-client/templates/standardSchema.ts'),
  sse: require.resolve('@kubb/plugin-client/templates/sse.ts'),
}
