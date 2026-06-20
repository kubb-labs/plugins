import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

/**
 * Absolute path to the shared `RequestResult` contract fetch runtime, the template plugin-fetch
 * ships and injects. Resolved through plugin-fetch's own `./templates/*` export so it stays correct
 * no matter where the package is installed. plugin-client injects this as `.kubb/client.ts` when
 * `client: 'fetch'` and no `importPath` is set, so its bundled runtime is identical to plugin-fetch's.
 */
export const contractFetchClientTemplatePath: string = require.resolve('@kubb/plugin-fetch/templates/fetch.ts')

/**
 * Absolute path to the shared `RequestResult` contract axios runtime, the template plugin-axios
 * ships and injects. Resolved through plugin-axios's own `./templates/*` export so it stays correct
 * no matter where the package is installed. plugin-client injects this as `.kubb/client.ts` when
 * `client: 'axios'` and no `importPath` is set, so its bundled runtime is identical to plugin-axios's.
 */
export const contractAxiosClientTemplatePath: string = require.resolve('@kubb/plugin-axios/templates/axios.ts')

/**
 * Absolute path to the legacy `config.ts` template (the `buildFormData` helper), resolved relative
 * to this package's own location. Pass it to a file node's `copy` field to emit the template into
 * the generated folder verbatim.
 *
 * @deprecated Part of the legacy data-returning runtime kept for the query plugins until they move
 * to the `RequestResult` contract. The contract runtime serializes form-data itself, so contract
 * output never needs this.
 */
export const configTemplatePath = fileURLToPath(new URL('../templates/config.ts', import.meta.url))

/**
 * Absolute path to the legacy data-returning axios client template, resolved relative to this
 * package's own location. Pass it to a file node's `copy` field to emit the template into the
 * generated folder verbatim.
 *
 * @deprecated The legacy data-returning runtime, kept for the query plugins until they move to the
 * `RequestResult` contract. plugin-client's own output now uses {@link contractAxiosClientTemplatePath}.
 */
export const axiosClientTemplatePath = fileURLToPath(new URL('../templates/clients/axios.ts', import.meta.url))

/**
 * Absolute path to the legacy data-returning fetch client template, resolved relative to this
 * package's own location. Pass it to a file node's `copy` field to emit the template into the
 * generated folder verbatim.
 *
 * @deprecated The legacy data-returning runtime, kept for the query plugins until they move to the
 * `RequestResult` contract. plugin-client's own output now uses {@link contractFetchClientTemplatePath}.
 */
export const fetchClientTemplatePath = fileURLToPath(new URL('../templates/clients/fetch.ts', import.meta.url))
