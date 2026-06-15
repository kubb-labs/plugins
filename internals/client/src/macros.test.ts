import { describe, expect, test } from 'vitest'
import { defaultMacros } from './macros.ts'

describe('defaultMacros', () => {
  test('ships the simplify-union macro', () => {
    expect(defaultMacros.map((macro) => macro.name)).toContain('simplify-union')
  })
})
