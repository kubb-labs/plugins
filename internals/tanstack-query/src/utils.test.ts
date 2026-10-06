import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildCallResultBody, classifyOperation, getDefaultPageParamsWarning, hasQueryKeyParams, matchesInfinite, resolveInfiniteConfig } from './utils.ts'

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

  test('query: false still allows an operation to be classified as a mutation', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, { query: false, mutation: { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' } }),
    ).toStrictEqual({ isQuery: false, isMutation: true })
  })

  test('mutation: false still allows an operation to be classified as a query', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(classifyOperation(node, { query: { methods: ['GET'], importPath: '@tanstack/react-query' }, mutation: false })).toStrictEqual({
      isQuery: true,
      isMutation: false,
    })
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

describe('buildCallResultBody', () => {
  test('calls unwrap() on the full result by default', () => {
    expect(buildCallResultBody('getPetById({ throwOnError: true })')).toBe('return getPetById({ throwOnError: true }).unwrap()')
  })

  test('returns the call directly when the client already resolves to bare data', () => {
    expect(buildCallResultBody('getPetById({ throwOnError: true })', { returnType: 'data' })).toBe('return await getPetById({ throwOnError: true })')
  })
})

const listPetsNode = (schema: ast.SchemaNode, paramName = 'page') =>
  ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    parameters: [ast.factory.createParameter({ name: paramName, in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
    responses: [ast.factory.createResponse({ statusCode: '200', schema })],
  })

const pageSchema = ast.factory.createSchema({
  type: 'object',
  properties: [ast.factory.createProperty({ name: 'hasNext', schema: ast.factory.createSchema({ type: 'boolean' }), required: true })],
})
const arraySchema = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })

const infinite = (options: Parameters<typeof resolveInfiniteConfig>[0] = {}) => resolveInfiniteConfig({ queryParam: 'page', ...options }) || {}

describe('resolveInfiniteConfig', () => {
  test('clears the page param code by default', () => {
    expect(resolveInfiniteConfig({})).toMatchObject({ getNextPageParam: null, getPreviousPageParam: null })
  })

  test('preserves configured page param code', () => {
    expect(
      resolveInfiniteConfig({
        getNextPageParam: '(lastPage) => lastPage.next',
        getPreviousPageParam: '(firstPage) => firstPage.prev',
      }),
    ).toMatchObject({
      getNextPageParam: '(lastPage) => lastPage.next',
      getPreviousPageParam: '(firstPage) => firstPage.prev',
    })
  })
})

describe('matchesInfinite', () => {
  test('matches an operation that takes the queryParam', () => {
    expect(matchesInfinite(listPetsNode(pageSchema), infinite())).toBe(true)
  })

  test('matches an optional queryParam declared with a trailing ?', () => {
    expect(matchesInfinite(listPetsNode(pageSchema, 'page?'), infinite())).toBe(true)
  })

  test('skips an operation without the queryParam', () => {
    expect(matchesInfinite(listPetsNode(pageSchema, 'cursor'), infinite())).toBe(false)
  })

  test('skips an operation with no parameters', () => {
    const noParamsNode = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      parameters: [],
      responses: [ast.factory.createResponse({ statusCode: '200', schema: pageSchema })],
    })
    expect(matchesInfinite(noParamsNode, infinite())).toBe(false)
  })
})

describe('getDefaultPageParamsWarning', () => {
  test('warns when the default page params meet an object response', () => {
    expect(getDefaultPageParamsWarning(listPetsNode(pageSchema), infinite())).toContain('listPets: the default infinite page params expect an array response')
  })

  test('resolves a ref to the response schema', () => {
    const ref = ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/PetPage', schema: pageSchema })

    expect(getDefaultPageParamsWarning(listPetsNode(ref), infinite())).not.toBeNull()
  })

  test('resolves chained refs to the response schema', () => {
    const innerRef = ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/ArrayOfPets', schema: arraySchema })
    const outerRef = ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/PetList', schema: innerRef })

    expect(getDefaultPageParamsWarning(listPetsNode(outerRef), infinite())).toBeNull()
  })

  test('stays quiet for an array response', () => {
    expect(getDefaultPageParamsWarning(listPetsNode(arraySchema), infinite())).toBeNull()
  })

  test('stays quiet when response has no schema', () => {
    const noSchemaNode = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      parameters: [ast.factory.createParameter({ name: 'page', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
      responses: [],
    })
    expect(getDefaultPageParamsWarning(noSchemaNode, infinite())).toBeNull()
  })

  test('warns when response schema is a primitive type', () => {
    const stringSchema = ast.factory.createSchema({ type: 'string' })
    expect(getDefaultPageParamsWarning(listPetsNode(stringSchema), infinite())).not.toBeNull()
  })

  test.each([
    { getNextPageParam: '(lastPage) => lastPage.next' },
    { getPreviousPageParam: '(firstPage) => firstPage.previous' },
    { nextParam: 'next' },
    { cursorParam: 'cursor' },
  ])('stays quiet when the page params are configured: %o', (options) => {
    expect(getDefaultPageParamsWarning(listPetsNode(pageSchema), infinite(options))).toBeNull()
  })
})
