import { fileURLToPath } from 'node:url'

/** Absolute path to the axios client template, copied into `.kubb/client.ts`. */
export const axiosClientTemplatePath = fileURLToPath(new URL('../templates/axios.ts', import.meta.url))

/** Absolute path to the axios serializers template, copied into `.kubb/serializers.ts`. */
export const axiosSerializersTemplatePath = fileURLToPath(new URL('../templates/serializers.ts', import.meta.url))
