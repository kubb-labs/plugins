import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { transform } from './transform.ts'

const fileName = path.resolve(import.meta.dirname, '../../../schemas/3.0.x/petStore.yaml')

describe('transform', () => {
  test('returns the plugin-ts types of a spec as one module', async () => {
    const result = await transform({ fileName, content: await readFile(fileName, 'utf8') })

    expect(result.diagnostics).toBeUndefined()
    expect(result.extension).toBe('.ts')
    expect(result.text).toContain('export type Pet = {')
    expect(result.text).not.toMatch(/^import /m)
  })

  test('returns an empty module and a diagnostic for an invalid spec', async () => {
    const result = await transform({ fileName, content: 'openapi: 3.0.0\ninfo: [oops\n' })

    expect(result.text).toBe('export {}')
    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics?.[0]?.messageText).toContain('JSON or YAML')
  })
})
