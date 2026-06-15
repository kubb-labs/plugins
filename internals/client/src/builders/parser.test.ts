import { ast } from '@kubb/core'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import { buildZodResponseParse, isParserEnabled, resolveQueryParamsParser, resolveRequestParser, resolveResponseParser } from './parser.ts'

const node = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('parser resolvers', () => {
  test('isParserEnabled tracks every form', () => {
    expect(isParserEnabled(false)).toBe(false)
    expect(isParserEnabled('zod')).toBe(true)
    expect(isParserEnabled({ request: 'zod' })).toBe(true)
    expect(isParserEnabled({})).toBe(false)
  })

  test("the 'zod' shorthand maps to response parsing only", () => {
    expect(resolveResponseParser('zod')).toBe('zod')
    expect(resolveRequestParser('zod')).toBeNull()
    expect(resolveQueryParamsParser('zod')).toBeNull()
  })

  test('the object form opts in per direction', () => {
    expect(resolveRequestParser({ request: 'zod' })).toBe('zod')
    expect(resolveQueryParamsParser({ request: 'zod' })).toBe('zod')
    expect(resolveResponseParser({ response: 'zod' })).toBe('zod')
  })
})

describe('buildZodResponseParse', () => {
  test('resolves the success-only response schema', () => {
    expect(buildZodResponseParse(node, resolverZod)).toStrictEqual({ expression: 'addPetResponseSchema', importNames: ['addPetResponseSchema'] })
  })
})
