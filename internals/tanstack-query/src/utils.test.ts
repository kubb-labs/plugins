import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { classifyOperation, hasQueryKeyParams } from './utils.ts'

describe('classifyOperation', () => {
  test('classifies a GET as a query when methods include it', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(classifyOperation(node, { query: { methods: ['GET'], importPath: '@tanstack/react-query' }, mutation: false })).toStrictEqual({
      isQuery: true,
      isMutation: false,
    })
  })

  test('classifies a POST as a mutation when query does not claim the method', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, {
        query: { methods: ['GET'], importPath: '@tanstack/react-query' },
        mutation: { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' },
      }),
    ).toStrictEqual({ isQuery: false, isMutation: true })
  })

  test('a method claimed by query never counts as a mutation, even if mutation.methods also lists it', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, {
        query: { methods: ['POST'], importPath: '@tanstack/react-query' },
        mutation: { methods: ['POST'], importPath: '@tanstack/react-query' },
      }),
    ).toStrictEqual({ isQuery: true, isMutation: false })
  })

  test('query: false still marks every operation as a query', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, { query: false, mutation: { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' } }),
    ).toStrictEqual({ isQuery: true, isMutation: false })
  })
})

describe('hasQueryKeyParams', () => {
  test('returns false when operation has no parameters', () => {
    const node = ast.factory.createOperation({ operationId: 'getRoot', method: 'GET', path: '/' })
    expect(hasQueryKeyParams(node)).toBe(false)
  })

  test('returns false when operation only has header parameters', () => {
    const node = ast.factory.createOperation({
      operationId: 'retrieveMyProfile',
      method: 'GET',
      path: '/user/me',
      parameters: [ast.factory.createParameter({ name: 'X-Request-Id', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) })],
    })
    expect(hasQueryKeyParams(node)).toBe(false)
  })

  test('returns true when operation has path parameters', () => {
    const node = ast.factory.createOperation({
      operationId: 'getPetById',
      method: 'GET',
      path: '/pets/:petId',
      parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) })],
    })
    expect(hasQueryKeyParams(node)).toBe(true)
  })

  test('returns true when operation has query parameters', () => {
    const node = ast.factory.createOperation({
      operationId: 'findPetsByTags',
      method: 'GET',
      path: '/pets/findByTags',
      parameters: [ast.factory.createParameter({ name: 'tags', in: 'query', schema: ast.factory.createSchema({ type: 'array' }) })],
    })
    expect(hasQueryKeyParams(node)).toBe(true)
  })

  test('returns true when operation has a request body', () => {
    const node = ast.factory.createOperation({
      operationId: 'searchPets',
      method: 'POST',
      path: '/pets/search',
      requestBody: ast.factory.createRequestBody({
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })],
      }),
    })
    expect(hasQueryKeyParams(node)).toBe(true)
  })

  test('returns true when operation has headers and query parameters', () => {
    const node = ast.factory.createOperation({
      operationId: 'listUsers',
      method: 'GET',
      path: '/users',
      parameters: [
        ast.factory.createParameter({ name: 'Authorization', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'number' }) }),
      ],
    })
    expect(hasQueryKeyParams(node)).toBe(true)
  })
})
