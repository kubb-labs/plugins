import { describe, expect, test } from 'vitest'
import { isValidatorEnabled, resolveParamsValidator, resolveRequestValidator } from './validatorOptions.ts'

describe('validator resolvers', () => {
  test('isValidatorEnabled tracks every form', () => {
    expect(isValidatorEnabled(false)).toBe(false)
    expect(isValidatorEnabled('zod')).toBe(true)
    expect(isValidatorEnabled({ request: 'zod' })).toBe(true)
    expect(isValidatorEnabled({ params: 'zod' })).toBe(true)
    expect(isValidatorEnabled({})).toBe(false)
  })

  test('request and params opt in independently', () => {
    expect(resolveParamsValidator({ request: 'zod' })).toBeNull()
    expect(resolveRequestValidator({ params: 'zod' })).toBeNull()
  })
})
