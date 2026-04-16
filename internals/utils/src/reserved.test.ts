import { describe, expect, test } from 'vitest'
import { isValidVarName } from './reserved.ts'

describe('isValidVarName', () => {
  test('returns true for valid identifiers', () => {
    expect(isValidVarName('foo')).toBe(true)
    expect(isValidVarName('fooBar')).toBe(true)
    expect(isValidVarName('_foo')).toBe(true)
  })

  test('returns false for reserved words', () => {
    expect(isValidVarName('delete')).toBe(false)
    expect(isValidVarName('var')).toBe(false)
  })

  test('returns false for invalid identifiers', () => {
    expect(isValidVarName('1test')).toBe(false)
    expect(isValidVarName('foo-bar')).toBe(false)
  })
})
