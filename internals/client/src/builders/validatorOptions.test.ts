import { describe, expect, test } from 'vitest'
import { isValidatorEnabled, resolveParamsValidator, resolveRequestValidator, resolveResponseValidator } from './validatorOptions.ts'

describe('validator resolvers', () => {
  test('isValidatorEnabled tracks every form', () => {
    expect(isValidatorEnabled(false)).toBe(false)
    expect(isValidatorEnabled('zod')).toBe(true)
    expect(isValidatorEnabled({ request: 'zod' })).toBe(true)
    expect(isValidatorEnabled({ params: 'zod' })).toBe(true)
    expect(isValidatorEnabled({})).toBe(false)
  })

  test("the 'zod' shorthand maps to response parsing only", () => {
    expect(resolveResponseValidator('zod')).toBe('zod')
    expect(resolveRequestValidator('zod')).toBeNull()
    expect(resolveParamsValidator('zod')).toBeNull()
  })

  test('the object form opts in per direction', () => {
    expect(resolveRequestValidator({ request: 'zod' })).toBe('zod')
    expect(resolveParamsValidator({ params: 'zod' })).toBe('zod')
    expect(resolveResponseValidator({ response: 'zod' })).toBe('zod')
  })

  test('request and params opt in independently', () => {
    expect(resolveParamsValidator({ request: 'zod' })).toBeNull()
    expect(resolveRequestValidator({ params: 'zod' })).toBeNull()
  })
})
