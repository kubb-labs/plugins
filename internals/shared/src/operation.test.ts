import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import {
  buildOperationComments,
  buildRequestConfigType,
  findSuccessStatusCode,
  getContentTypeInfo,
  getOperationParameters,
  getOperationSuccessResponses,
  getPrimarySuccessResponse,
  getStatusCodeNumber,
  getSuccessResponses,
  isErrorStatusCode,
  isSuccessStatusCode,
  resolveErrorNames,
  resolveOperationTypeNames,
  resolveResponseTypes,
  resolveStatusCodeNames,
  resolveSuccessNames,
  type OperationTypeNameResolver,
  type RequestConfigResolver,
  type ResponseNameResolver,
  type ResponseStatusNameResolver,
} from './operation.ts'

const resolver: RequestConfigResolver & ResponseNameResolver & ResponseStatusNameResolver & OperationTypeNameResolver = {
  resolveDataName(node) {
    return `${node.operationId}Data`
  },
  resolvePathParamsName(_node, param) {
    return `${param.name}PathParams`
  },
  resolveQueryParamsName(_node, param) {
    return `${param.name}QueryParams`
  },
  resolveHeaderParamsName(_node, param) {
    return `${param.name}HeaderParams`
  },
  resolveResponseName(node) {
    return `${node.operationId}Response`
  },
  resolveResponseStatusName(_node, statusCode) {
    return `Status${statusCode}`
  },
}

describe('getContentTypeInfo', () => {
  test('returns defaults for operations without a request body', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(getContentTypeInfo(node)).toStrictEqual({
      contentTypes: [],
      isMultipleContentTypes: false,
      contentTypeUnion: '',
      defaultContentType: 'application/json',
      hasFormData: false,
    })
  })

  test('detects multiple content types and form data', () => {
    const node = ast.factory.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: {
        content: [
          ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
          ast.factory.createContent({ contentType: 'multipart/form-data', schema: ast.factory.createSchema({ type: 'object' }) }),
        ],
      },
    })

    expect(getContentTypeInfo(node)).toStrictEqual({
      contentTypes: ['application/json', 'multipart/form-data'],
      isMultipleContentTypes: true,
      contentTypeUnion: '"application/json" | "multipart/form-data"',
      defaultContentType: 'application/json',
      hasFormData: true,
    })
  })
})

describe('buildRequestConfigType', () => {
  test('adds the request data type and content type option when needed', () => {
    const node = ast.factory.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: {
        content: [
          ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
          ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object' }) }),
        ],
      },
    })

    expect(buildRequestConfigType(node, resolver)).toBe(
      'Partial<RequestConfig<createPetData>> & { client?: Client; contentType?: "application/json" | "application/xml" }',
    )
  })

  test('uses the untyped request config when no request schema exists', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(buildRequestConfigType(node, resolver)).toBe('Partial<RequestConfig> & { client?: Client }')
  })
})

describe('buildOperationComments', () => {
  test('builds path-template links by default', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      description: 'Show pet',
      summary: 'Show',
      deprecated: true,
    })

    expect(buildOperationComments(node)).toStrictEqual(['@description Show pet', '@summary Show', '@deprecated', '{@link /pets/:petId}'])
  })

  test('supports URLPath links before deprecation and multiline trimming', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{pet-id}',
      description: 'Show pet\n  details',
      deprecated: true,
    })

    expect(buildOperationComments(node, { link: 'urlPath', linkPosition: 'beforeDeprecated', splitLines: true })).toStrictEqual([
      '@description Show pet',
      'details',
      '{@link /pets/:pet-id}',
      '@deprecated',
    ])
  })
})

describe('response status helpers', () => {
  const node = ast.factory.createOperation({
    operationId: 'createPet',
    method: 'POST',
    path: '/pets',
    responses: [
      ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object' }) }),
      ast.factory.createResponse({ statusCode: '400', schema: ast.factory.createSchema({ type: 'object' }) }),
      ast.factory.createResponse({ statusCode: 'default', schema: ast.factory.createSchema({ type: 'object' }) }),
    ],
  })

  test('parses numeric status codes', () => {
    expect(getStatusCodeNumber('201')).toBe(201)
    expect(getStatusCodeNumber('default')).toBeNull()
  })

  test('detects success and error status codes', () => {
    expect(isSuccessStatusCode('201')).toBe(true)
    expect(isSuccessStatusCode('400')).toBe(false)
    expect(isErrorStatusCode('400')).toBe(true)
    expect(isErrorStatusCode('default')).toBe(false)
  })

  test('filters success responses', () => {
    expect(getSuccessResponses(node.responses).map((response) => response.statusCode)).toStrictEqual(['201'])
    expect(getOperationSuccessResponses(node).map((response) => response.statusCode)).toStrictEqual(['201'])
    expect(getPrimarySuccessResponse(node)?.statusCode).toBe('201')
  })

  test('finds the first success status code', () => {
    expect(findSuccessStatusCode(node.responses)).toBe('201')
  })

  test('resolves error response names', () => {
    expect(resolveErrorNames(node, resolver)).toStrictEqual(['Status400'])
  })

  test('resolves success response names', () => {
    expect(resolveSuccessNames(node, resolver)).toStrictEqual(['Status201'])
  })

  test('resolves all response status names', () => {
    expect(resolveStatusCodeNames(node, resolver)).toStrictEqual(['Status201', 'Status400', 'Statusdefault'])
  })

  test('resolves response types', () => {
    expect(resolveResponseTypes(node, resolver)).toStrictEqual([
      [201, 'createPetResponse'],
      [400, 'Status400'],
      ['default', 'createPetResponse'],
    ])
  })
})

describe('getOperationParameters', () => {
  test('groups cased parameters by location', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{pet-id}',
      parameters: [
        ast.factory.createParameter({ name: 'pet-id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'page-size', in: 'query', schema: ast.factory.createSchema({ type: 'number' }) }),
        ast.factory.createParameter({ name: 'x-api-key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'session-id', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
    })

    const grouped = getOperationParameters(node, { paramsCasing: 'camelcase' })

    expect(grouped.path.map((param) => param.name)).toStrictEqual(['petId'])
    expect(grouped.query.map((param) => param.name)).toStrictEqual(['pageSize'])
    expect(grouped.header.map((param) => param.name)).toStrictEqual(['xApiKey'])
    expect(grouped.cookie.map((param) => param.name)).toStrictEqual(['sessionId'])
  })
})

describe('resolveOperationTypeNames', () => {
  test('collects parameter, request, response, and status type names', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'POST',
      path: '/pets/{pet-id}',
      parameters: [
        ast.factory.createParameter({ name: 'pet-id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'page-size', in: 'query', schema: ast.factory.createSchema({ type: 'number' }) }),
        ast.factory.createParameter({ name: 'x-api-key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
      requestBody: {
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })],
      },
      responses: [
        ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: '400', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(resolveOperationTypeNames(node, resolver, { paramsCasing: 'camelcase', exclude: ['Status200'] })).toStrictEqual([
      'petIdPathParams',
      'pageSizeQueryParams',
      'xApiKeyHeaderParams',
      'showPetData',
      'showPetResponse',
      'Status400',
    ])
  })

  test('can include only error status type names', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      responses: [
        ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: '404', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(resolveOperationTypeNames(node, resolver, { responseStatusNames: 'error' })).toStrictEqual(['showPetResponse', 'Status404'])
  })
})
