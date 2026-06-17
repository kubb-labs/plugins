import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// @ts-expect-error - import attributes are handled at build time by importAttributeTextPlugin
import content from '../../templates/fetch.txt' with { type: 'text' }

// At build time `importAttributeTextPlugin` replaces this whole module with the inlined string. The
// fs fallback runs when that transform is absent (unit tests against source), where the `.txt`
// import can resolve to the asset path instead of the file contents.
export const source: string =
  typeof content === 'string' && content.includes('\n') ? content : readFileSync(fileURLToPath(new URL('../../templates/fetch.txt', import.meta.url)), 'utf-8')
