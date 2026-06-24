import { ast } from '@kubb/core'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import { buildParserHooks } from './validator.ts'

const addPet = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  requestBody: {
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

const addPetWithError = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  responses: [
    ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' }),
    ast.factory.createResponse({ statusCode: '422', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'err' }),
  ],
})

describe('buildParserHooks', () => {
  test('emits no parsers when the parser is off', () => {
    expect(buildParserHooks({ node: addPet, parser: false, zodResolver: resolverZod })).toStrictEqual({
      request: null,
      response: null,
      error: null,
      importedZodNames: [],
    })
  })

  test("the 'zod' shorthand wires the response parser only when there is no error response", () => {
    const hooks = buildParserHooks({ node: addPet, parser: 'zod', zodResolver: resolverZod })
    expect(hooks.request).toBeNull()
    expect(hooks.response).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.error).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema'])
  })

  test("the 'zod' shorthand also wires the error parser when an error response is documented", () => {
    const hooks = buildParserHooks({ node: addPetWithError, parser: 'zod', zodResolver: resolverZod })
    expect(hooks.response).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.error).toBe('(data: unknown) => addPetErrorSchema.parse(data)')
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema', 'addPetErrorSchema'])
  })

  test('the object form wires the request parser from the data schema', () => {
    const hooks = buildParserHooks({ node: addPet, parser: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('(data: unknown) => addPetDataSchema.parse(data)')
    expect(hooks.response).toBeNull()
    expect(hooks.error).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetDataSchema'])
  })

  test('wires both directions when both are enabled', () => {
    const hooks = buildParserHooks({ node: addPet, parser: { request: 'zod', response: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('(data: unknown) => addPetDataSchema.parse(data)')
    expect(hooks.response).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.error).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetDataSchema', 'addPetResponseSchema'])
  })
})
