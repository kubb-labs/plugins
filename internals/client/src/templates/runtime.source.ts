import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// @ts-expect-error - import attributes are handled at build time by importAttributeTextPlugin
import content from '../../templates/runtime.ts' with { type: 'text' }

// At build time `importAttributeTextPlugin` replaces this whole module with the inlined string. The
// fs fallback only runs when that transform is absent (unit tests against source).
export const source: string =
  typeof content === 'string' ? content : readFileSync(fileURLToPath(new URL('../../templates/runtime.ts', import.meta.url)), 'utf-8')
