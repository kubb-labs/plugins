import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** The bundled `withQueryKey` helper that every query hook imports. */
export const withQueryKeyTemplate = fileURLToPath(new URL('../templates/withQueryKey.ts', import.meta.url))

/** Where the build writes `withQueryKey.ts`, next to the other `.kubb` runtime files. */
export function withQueryKeyPath(config: { root: string; output: { path: string } }): string {
  return path.resolve(config.root, config.output.path, '.kubb', 'withQueryKey.ts')
}
