import { describe, expect, test } from 'vitest'
import { ensureValidVarName, isValidVarName } from './reserved.ts'

describe('isValidVarName', () => {
  test('valid identifiers return true', () => {
    expect(isValidVarName('status')).toBe(true)
    expect(isValidVarName('_private')).toBe(true)
    expect(isValidVarName('$el')).toBe(true)
    expect(isValidVarName('camelCase')).toBe(true)
    expect(isValidVarName('with123')).toBe(true)
  })

  test('reserved words return false', () => {
    expect(isValidVarName('class')).toBe(false)
    expect(isValidVarName('await')).toBe(false)
    expect(isValidVarName('var')).toBe(false)
    expect(isValidVarName('return')).toBe(false)
    expect(isValidVarName('null')).toBe(false)
  })

  test('identifiers starting with a digit return false', () => {
    expect(isValidVarName('42foo')).toBe(false)
    expect(isValidVarName('1test')).toBe(false)
  })

  test('names with special characters return false', () => {
    expect(isValidVarName('foo-bar')).toBe(false)
    expect(isValidVarName('foo bar')).toBe(false)
    expect(isValidVarName('foo.bar')).toBe(false)
  })
})

describe('ensureValidVarName', () => {
  test('prefixes digit-leading and reserved names with _ and leaves valid ones alone', () => {
    expect(ensureValidVarName('status')).toBe('status')
    expect(ensureValidVarName('409Schema')).toBe('_409Schema')
    expect(ensureValidVarName('class')).toBe('_class')
  })
})
