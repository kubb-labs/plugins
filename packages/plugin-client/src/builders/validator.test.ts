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

function toResponse(statusCode: ast.StatusCode) {
  return ast.factory.createResponse({ statusCode, schema: ast.factory.createSchema({ type: 'object', properties: [] }) })
}

describe('buildValidatorHooks', () => {
  test("the 'zod' shorthand also wires the error validator when an error response is documented", () => {
    const hooks = buildValidatorHooks({ node: addPetWithError, validator: 'zod', zodResolver: resolverZod })
    expect(hooks.response).toBe('addPetResponseSchema')
    expect(hooks.error).toBe('{ 422: addPetStatus422Schema }')
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema', 'addPetStatus422Schema'])
  })

  test('keys the error map by status, quoting range and default keys and skipping bodiless statuses', () => {
    const node = {
      ...addPetWithError,
      responses: [
        ...addPetWithError.responses,
        toResponse('5xx'),
        toResponse('4xx'),
        toResponse('default'),
        ast.factory.createResponse({ statusCode: '409', description: 'no body' }),
      ],
    }
    const hooks = buildValidatorHooks({ node, validator: 'zod', zodResolver: resolverZod })
    expect(hooks.error).toBe("{ 422: addPetStatus422Schema, '5xx': addPetStatus5xxSchema, '4xx': addPetStatus4xxSchema, 'default': addPetStatusDefaultSchema }")
    expect(hooks.importedZodNames).toStrictEqual([
      'addPetResponseSchema',
      'addPetStatus422Schema',
      'addPetStatus5xxSchema',
      'addPetStatus4xxSchema',
      'addPetStatusDefaultSchema',
    ])
  })

  test('wires no response validator for an operation without a response body schema, since plugin-zod emits none', () => {
    const bodiless = [ast.factory.createResponse({ statusCode: '204', description: 'no body' })]
    for (const responses of [[], bodiless]) {
      const hooks = buildValidatorHooks({ node: { ...addPet, responses }, validator: 'zod', zodResolver: resolverZod })
      expect(hooks.response).toBeNull()
      expect(hooks.importedZodNames).toStrictEqual([])
    }
  })

  test('the object form wires the request validator from the body schema', () => {
    const hooks = buildValidatorHooks({ node: addPet, validator: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('addPetBodySchema')
    expect(hooks.response).toBeNull()
    expect(hooks.error).toBeNull()
    expect(hooks.importedZodNames).toStrictEqual(['addPetBodySchema'])
  })

  test('request alone leaves the params unvalidated', () => {
    const hooks = buildValidatorHooks({ node: putEvent, validator: { request: 'zod' }, zodResolver: resolverZod })
    expect(hooks.request).toBe('putEventBodySchema')
    expect(hooks.path).toBeNull()
    expect(hooks.query).toBeNull()
    expect(hooks.headers).toBeNull()
  })
})
