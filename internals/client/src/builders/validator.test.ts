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

describe('buildParserHooks', () => {
  test('emits no parsers when the parser is off', () => {
    expect(buildParserHooks({ node: addPet, parser: false, zodResolver: resolverZod })).toStrictEqual({
      request: null,
      response: null,
      importedZodNames: [],
    })
  })

  test("the 'zod' shorthand wires the response parser only", () => {
    const hooks = buildParserHooks({ node: addPet, parser: 'zod', zodResolver: resolverZod })
    expect(hooks.request).toBeNull()
    expect(hooks.response).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema'])
  })

  test('the object form wires the request parser from the data schema', () => {
    const hooks = buildParserHooks({ node: addPet, parser: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('(data: unknown) => addPetDataSchema.parse(data)')
    expect(hooks.response).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetDataSchema'])
  })

  test('wires both directions when both are enabled', () => {
    const hooks = buildParserHooks({ node: addPet, parser: { request: 'zod', response: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('(data: unknown) => addPetDataSchema.parse(data)')
    expect(hooks.response).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.importedZodNames).toStrictEqual(['addPetDataSchema', 'addPetResponseSchema'])
  })
})
