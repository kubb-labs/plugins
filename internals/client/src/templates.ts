import { fileURLToPath } from 'node:url'

/**
 * Absolute path to the Standard Schema runtime template. Pass it to a file node's `copy` field to
 * emit the helper into the generated `.kubb/standard-schema.ts` verbatim.
 */
export const standardSchemaTemplatePath = fileURLToPath(new URL('../templates/standard-schema.ts', import.meta.url))
