import { describe, expect, test } from 'vitest'
import { parseOptions } from './options.ts'

describe('parseOptions', () => {
  test('returns no options when none are set', () => {
    expect(parseOptions(undefined)).toStrictEqual({ options: {}, diagnostics: [] })
  })

  test('keeps a valid arrayType', () => {
    expect(parseOptions({ arrayType: 'generic' })).toStrictEqual({ options: { arrayType: 'generic' }, diagnostics: [] })
  })

  test('reports an invalid arrayType and an unknown key', () => {
    const { options, diagnostics } = parseOptions({ arrayType: 'list', enumType: 'literal' })

    expect(options).toStrictEqual({})
    expect(diagnostics.map((diagnostic) => diagnostic.path)).toStrictEqual([['arrayType'], ['enumType']])
  })

  test('reports options that are not an object', () => {
    expect(parseOptions(['generic']).diagnostics).toHaveLength(1)
  })
})
