import { ast } from 'kubb/kit'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import {
  buildZodResponseParse,
  isValidatorEnabled,
  resolveQueryParamsValidator,
  resolveRequestValidator,
  resolveResponseValidator,
} from './validatorOptions.ts'

const node = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('validator resolvers', () => {
  test('isValidatorEnabled tracks every form', () => {
    expect(isValidatorEnabled(false)).toBe(false)
    expect(isValidatorEnabled('zod')).toBe(true)
    expect(isValidatorEnabled({ request: 'zod' })).toBe(true)
    expect(isValidatorEnabled({})).toBe(false)
  })

  test("the 'zod' shorthand maps to response parsing only", () => {
    expect(resolveResponseValidator('zod')).toBe('zod')
    expect(resolveRequestValidator('zod')).toBeNull()
    expect(resolveQueryParamsValidator('zod')).toBeNull()
  })

  test('the object form opts in per direction', () => {
    expect(resolveRequestValidator({ request: 'zod' })).toBe('zod')
    expect(resolveQueryParamsValidator({ request: 'zod' })).toBe('zod')
    expect(resolveResponseValidator({ response: 'zod' })).toBe('zod')
  })
})

describe('buildZodResponseParse', () => {
  test('resolves the success-only response schema', () => {
    expect(buildZodResponseParse(node, resolverZod)).toStrictEqual({ expression: 'addPetResponseSchema', importNames: ['addPetResponseSchema'] })
  })
})
