import { ast } from '@kubb/core'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import { buildValidatorHooks } from './validator.ts'

const addPet = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  requestBody: { content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })] },
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildValidatorHooks', () => {
  test('emits no validators when the parser is off', () => {
    expect(buildValidatorHooks({ node: addPet, parser: false, zodResolver: resolverZod })).toStrictEqual({
      requestValidator: null,
      responseValidator: null,
      importedZodNames: [],
    })
  })

  test("the 'zod' shorthand wires the response validator only", () => {
    const hooks = buildValidatorHooks({ node: addPet, parser: 'zod', zodResolver: resolverZod })
    expect(hooks.requestValidator).toBeNull()
    expect(hooks.responseValidator).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema'])
  })

  test('the object form wires the request validator from the data schema', () => {
    const hooks = buildValidatorHooks({ node: addPet, parser: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.requestValidator).toBe('(data: unknown) => addPetDataSchema.parse(data)')
    expect(hooks.responseValidator).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetDataSchema'])
  })

  test('wires both directions when both are enabled', () => {
    const hooks = buildValidatorHooks({ node: addPet, parser: { request: 'zod', response: 'zod' }, zodResolver: resolverZod })
    expect(hooks.requestValidator).toBe('(data: unknown) => addPetDataSchema.parse(data)')
    expect(hooks.responseValidator).toBe('(data: unknown) => addPetResponseSchema.parse(data)')
    expect(hooks.importedZodNames).toStrictEqual(['addPetDataSchema', 'addPetResponseSchema'])
  })
})
