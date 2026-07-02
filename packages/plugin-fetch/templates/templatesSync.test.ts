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
  test.each(['serializers.ts', 'standardSchema.ts'])('%s is byte-identical in plugin-axios', (name) => {
    const fetchCopy = readFileSync(path.join(fetchTemplates, name), 'utf8')
    const axiosCopy = readFileSync(path.join(axiosTemplates, name), 'utf8')
    expect(axiosCopy).toBe(fetchCopy)
  })
})
