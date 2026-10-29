import { ast } from '@kubb/kit'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import { buildValidatorHooks } from './validator.ts'

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

const putEvent = ast.factory.createOperation({
  operationId: 'putEvent',
  method: 'PUT',
  path: '/events/{day}',
  tags: ['event'],
  parameters: [
    ast.factory.createParameter({ name: 'day', in: 'path', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createParameter({ name: 'after', in: 'query', required: false, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createParameter({ name: 'X-Trace', in: 'header', required: false, schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  requestBody: {
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildValidatorHooks', () => {
  test("the 'zod' shorthand also wires the error validator when an error response is documented", () => {
    const hooks = buildValidatorHooks({ node: addPetWithError, validator: 'zod', zodResolver: resolverZod })
    expect(hooks.response).toBe('addPetResponseSchema')
    expect(hooks.error).toBe('addPetErrorSchema')
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema', 'addPetErrorSchema'])
  })

  test('the object form wires the request validator from the body schema', () => {
    const hooks = buildValidatorHooks({ node: addPet, validator: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('addPetBodySchema')
    expect(hooks.response).toBeNull()
    expect(hooks.error).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetBodySchema'])
  })

  test('wires both directions when both are enabled', () => {
    const hooks = buildValidatorHooks({ node: addPet, validator: { request: 'zod', response: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('addPetBodySchema')
    expect(hooks.response).toBe('addPetResponseSchema')
    expect(hooks.error).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema', 'addPetBodySchema'])
  })

  test('params wires the grouped path, query, and headers schemas', () => {
    const hooks = buildValidatorHooks({ node: putEvent, validator: { params: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBeNull()
    expect(hooks.path).toBe('putEventPathSchema')
    expect(hooks.query).toBe('putEventQuerySchema')
    expect(hooks.headers).toBe('toHeadersStandardSchema(putEventHeadersSchema, putEventHeadersSchema.shape)')
    expect(hooks.importedZodNames).toStrictEqual(['putEventPathSchema', 'putEventQuerySchema', 'putEventHeadersSchema'])
  })

  test('params skips the groups an operation has no params in', () => {
    const hooks = buildValidatorHooks({ node: addPet, validator: { params: 'zod' }, zodResolver: resolverZod })
    expect(hooks.path).toBeNull()
    expect(hooks.query).toBeNull()
    expect(hooks.headers).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual([])
  })

  test('request alone leaves the params unvalidated', () => {
    const hooks = buildValidatorHooks({ node: putEvent, validator: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('putEventBodySchema')
    expect(hooks.path).toBeNull()
    expect(hooks.query).toBeNull()
    expect(hooks.headers).toBeNull()
  })
})
