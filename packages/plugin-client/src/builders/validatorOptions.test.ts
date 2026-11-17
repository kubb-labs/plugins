import { describe, expect, test } from 'vitest'
import { isValidatorEnabled, resolveParamsValidator, resolveRequestValidator, resolveResponseValidator, resolveValidatorLibrary } from './validatorOptions.ts'

describe('validator resolvers', () => {
  test('isValidatorEnabled tracks every form', () => {
    expect(isValidatorEnabled(false)).toBe(false)
    expect(isValidatorEnabled('zod')).toBe(true)
    expect(isValidatorEnabled({ request: 'zod' })).toBe(true)
    expect(isValidatorEnabled({ params: 'zod' })).toBe(true)
    expect(isValidatorEnabled({})).toBe(false)
  })

  test('request and params opt in independently', () => {
    expect(resolveParamsValidator({ request: 'zod' })).toBe(false)
    expect(resolveRequestValidator({ params: 'zod' })).toBe(false)
    expect(resolveRequestValidator({ request: 'valibot' })).toBe(true)
  })

  test('the string shorthand turns on the response only', () => {
    expect(resolveResponseValidator('valibot')).toBe(true)
    expect(resolveRequestValidator('valibot')).toBe(false)
    expect(resolveParamsValidator('valibot')).toBe(false)
  })

  test('resolveValidatorLibrary reads the library from every form', () => {
    expect(resolveValidatorLibrary(false)).toBeNull()
    expect(resolveValidatorLibrary({})).toBeNull()
    expect(resolveValidatorLibrary('valibot')).toBe('valibot')
    expect(resolveValidatorLibrary({ params: 'valibot' })).toBe('valibot')
    expect(resolveValidatorLibrary({ response: 'zod' })).toBe('zod')
  })
})
