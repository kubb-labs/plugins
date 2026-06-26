import { fileURLToPath } from 'node:url'

/**
 * Absolute path to the axios client runtime template, resolved relative to this package's own
 * location so it stays correct no matter which package imports it. Pass it to a file node's `copy`
 * field to emit the runtime into the generated `.kubb/client.ts` verbatim.
 */
export const axiosClientTemplatePath = fileURLToPath(new URL('../templates/axios.ts', import.meta.url))

/**
 * Absolute path to the Standard Schema runtime template. Pass it to a file node's `copy` field to
 * emit the helper into the generated `.kubb/standard-schema.ts` verbatim.
 */
export const standardSchemaTemplatePath = fileURLToPath(new URL('../templates/standard-schema.ts', import.meta.url))
