import { fileURLToPath } from 'node:url'

/**
 * Absolute path to the fetch client runtime template, resolved relative to this package's own
 * location so it stays correct no matter which package imports it. Pass it to a file node's `copy`
 * field to emit the runtime into the generated `.kubb/client.ts` verbatim.
 */
export const fetchClientTemplatePath = fileURLToPath(new URL('../templates/fetch.ts', import.meta.url))

/**
 * Absolute path to the fetch serializers template, emitted alongside the client runtime into
 * `.kubb/serializers.ts`. The generated `.kubb/client.ts` imports its default serializers from here.
 */
export const fetchSerializersTemplatePath = fileURLToPath(new URL('../templates/serializers.ts', import.meta.url))
