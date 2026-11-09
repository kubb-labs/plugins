import { describe, expect, test } from 'vitest'
import { isValidVarName } from './reserved.ts'

describe('isValidVarName', () => {
  test('valid identifiers return true', () => {
    expect(isValidVarName('status')).toBe(true)
    expect(isValidVarName('_private')).toBe(true)
    expect(isValidVarName('$el')).toBe(true)
    expect(isValidVarName('camelCase')).toBe(true)
    expect(isValidVarName('with123')).toBe(true)
  })
})
