import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const fetchTemplates = path.dirname(fileURLToPath(import.meta.url))
const axiosTemplates = path.resolve(fetchTemplates, '../../plugin-axios/templates')

/**
 * The transport-agnostic templates ship as a copy in every client plugin, so an edit to one copy
 * must land in the other. A drift here means a fix reached one client but not the other.
 */
describe('shared client templates', () => {
  test.each(['serializers.ts', 'standardSchema.ts', 'sse.ts'])('%s is byte-identical in plugin-axios', (name) => {
    const fetchCopy = readFileSync(path.join(fetchTemplates, name), 'utf8')
    const axiosCopy = readFileSync(path.join(axiosTemplates, name), 'utf8')
    expect(axiosCopy).toBe(fetchCopy)
  })
})

function declarationNames(source: string): Array<string> {
  return [...source.matchAll(/^(?:export )?(?:async )?(?:function\*? |const |class |type )([A-Za-z_]\w*)/gm)].map((match) => match[1]!)
}

/**
 * the fetch and axios client.ts mirror each other section by section, differing only in transport-specific
 * members. Comparing the order of the declarations both files share keeps that structure aligned,
 * so the two clients stay reviewable side by side.
 */
describe('client template structure', () => {
  test('the fetch and axios client.ts declare their shared members in the same order', () => {
    const fetchNames = declarationNames(readFileSync(path.join(fetchTemplates, 'client.ts'), 'utf8'))
    const axiosNames = declarationNames(readFileSync(path.join(axiosTemplates, 'client.ts'), 'utf8'))

    const shared = new Set(fetchNames.filter((name) => axiosNames.includes(name)))
    expect(fetchNames.filter((name) => shared.has(name))).toStrictEqual(axiosNames.filter((name) => shared.has(name)))
  })
})
