import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * The shared runtime source, read from the `runtime.ts` template shipped in this package. Slim
 * client plugins embed it into their generated `.kubb/client.ts` and append a transport prelude.
 *
 * `src/templates/` and the built `dist/templates/` sit at the same depth, so the relative path
 * resolves to the same file whether this runs from source (tests) or from the bundle.
 */
export const source = readFileSync(fileURLToPath(new URL('../../templates/runtime.ts', import.meta.url)), 'utf-8')
