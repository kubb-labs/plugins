import { fileURLToPath } from 'node:url'

/**
 * Absolute path to the slim fetch client runtime template, resolved relative to this package's own
 * location so it stays correct no matter which package imports it. Pass it to a file node's `copy`
 * field to emit the runtime into the generated `.kubb/client.ts` verbatim.
 */
export const fetchClientTemplatePath = fileURLToPath(new URL('../templates/clients/fetch.ts', import.meta.url))
