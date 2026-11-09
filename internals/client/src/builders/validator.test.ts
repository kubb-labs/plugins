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
    expect(hooks.errorStatus).toBe('[422]')
    expect(hooks.importedZodNames).toStrictEqual(['addPetResponseSchema', 'addPetErrorSchema'])
  })

  test('lists range keys in errorStatus and leaves it out when a default response covers every status', () => {
    // The AST type has no range keys, but the adapter passes keys such as `5XX` through as is.
    const toResponse = (statusCode: string) =>
      ast.factory.createResponse({ statusCode: statusCode as ast.StatusCode, schema: ast.factory.createSchema({ type: 'object', properties: [] }) })
    const withRange = {
      ...addPetWithError,
      responses: [...addPetWithError.responses, toResponse('5XX'), ast.factory.createResponse({ statusCode: '409', description: 'no body' })],
    }
    expect(buildValidatorHooks({ node: withRange, validator: 'zod', zodResolver: resolverZod }).errorStatus).toBe("[422, '5XX']")

    const withDefault = { ...addPetWithError, responses: [...addPetWithError.responses, toResponse('default')] }
    const hooks = buildValidatorHooks({ node: withDefault, validator: 'zod', zodResolver: resolverZod })
    expect(hooks.error).toBe('addPetErrorSchema')
    expect(hooks.errorStatus).toBeNull()
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
