import { fileURLToPath } from 'node:url'

/**
 * Absolute path to the `config.ts` template (the `buildFormData` helper), resolved relative to
 * this package's own location so it stays correct no matter which package imports it. Pass it to
 * a file node's `copy` field to emit the template into the generated folder verbatim.
 */
export const configTemplatePath = fileURLToPath(new URL('../templates/config.ts', import.meta.url))

/**
 * Absolute path to the axios client template, resolved relative to this package's own location.
 * Pass it to a file node's `copy` field to emit the template into the generated folder verbatim.
 */
export const axiosClientTemplatePath = fileURLToPath(new URL('../templates/clients/axios.ts', import.meta.url))

/**
 * Absolute path to the fetch client template, resolved relative to this package's own location.
 * Pass it to a file node's `copy` field to emit the template into the generated folder verbatim.
 */
export const fetchClientTemplatePath = fileURLToPath(new URL('../templates/clients/fetch.ts', import.meta.url))
