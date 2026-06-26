import { fileURLToPath } from 'node:url'

/** Absolute path to the fetch client template, copied into `.kubb/client.ts`. */
export const fetchClientTemplatePath = fileURLToPath(new URL('../templates/fetch.ts', import.meta.url))

/** Absolute path to the fetch serializers template, copied into `.kubb/serializers.ts`. */
export const fetchSerializersTemplatePath = fileURLToPath(new URL('../templates/serializers.ts', import.meta.url))
