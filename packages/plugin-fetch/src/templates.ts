import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

/** Absolute path to the fetch client template, copied into `.kubb/client.ts`. */
export const fetchClientTemplatePath = fileURLToPath(new URL('../templates/client.ts', import.meta.url))

/**
 * Absolute paths to the runtime templates `@kubb/plugin-client` ships for every client plugin, copied into `.kubb/core.ts`,
 * `.kubb/mediaTypes.ts`, `.kubb/serializers.ts`, `.kubb/standardSchema.ts`, and `.kubb/sse.ts`.
 */
export const coreTemplatePath = require.resolve('@kubb/plugin-client/templates/core.ts')
export const mediaTypesTemplatePath = require.resolve('@kubb/plugin-client/templates/mediaTypes.ts')
export const serializersTemplatePath = require.resolve('@kubb/plugin-client/templates/serializers.ts')
export const standardSchemaTemplatePath = require.resolve('@kubb/plugin-client/templates/standardSchema.ts')
export const sseTemplatePath = require.resolve('@kubb/plugin-client/templates/sse.ts')
