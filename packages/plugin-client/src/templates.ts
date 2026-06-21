import { createRequire } from 'node:module'

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
