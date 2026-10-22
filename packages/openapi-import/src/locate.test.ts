import { describe, expect, test } from 'vitest'
import { parseDocument } from 'yaml'
import { createLocator } from './locate.ts'

const source = [
  'components:',
  '  schemas:',
  '    Pet:',
  '      properties:',
  '        owner:',
  "          $ref: '#/components/schemas/Owner'",
  '    a/b:',
  '      type: string',
  '',
].join('\n')
const locate = createLocator(parseDocument(source))
const text = (range: { start: number; end: number } | undefined) => range && source.slice(range.start, range.end)

describe('createLocator', () => {
  test('locates keys and unescapes JSON pointer tokens', () => {
    expect(text(locate({ pointer: '#/components/schemas/Pet/properties/owner' }))).toBe('owner')
    expect(text(locate({ pointer: '#/components/schemas/a~1b' }))).toBe('a/b')
  })

  test('falls back to the first usage of an unresolved $ref', () => {
    expect(text(locate({ pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' }))).toBe("'#/components/schemas/Owner'")
    expect(locate({ pointer: '#/components/schemas/Missing' })).toBeUndefined()
  })
})
