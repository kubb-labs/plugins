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
  groupOperationTypeImports,
  inlineOperationResolver,
  resolveErrorNames,
  resolveOperationTypeImports,
  resolveOperationTypeNames,
  resolveRequestTypeName,
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
  resolveTypeName(name) {
    return name
  },
}

describe('operationTypes inlining', () => {
  const refOperation = ast.createOperation({
    operationId: 'addPet',
    method: 'POST',
    path: '/pet',
    requestBody: { content: [{ contentType: 'application/json', schema: ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }) }] },
    responses: [
      ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }) }),
      ast.createResponse({
        statusCode: '422',
        schema: ast.createSchema({ type: 'ref', name: 'HttpValidationError', ref: '#/components/schemas/HttpValidationError' }),
      }),
      ast.createResponse({ statusCode: '500', schema: ast.createSchema({ type: 'object', properties: [] }) }),
    ],
  })

  test('inlineOperationResolver inlines $ref response names so resolveSuccessNames needs no flag', () => {
    expect(resolveSuccessNames(refOperation, resolver)).toEqual(['Status200'])
    expect(resolveSuccessNames(refOperation, inlineOperationResolver(resolver, false))).toEqual(['Pet'])
  })

  test('inlineOperationResolver keeps inline aliases for non-$ref responses', () => {
    expect(resolveErrorNames(refOperation, resolver)).toEqual(['Status422', 'Status500'])
    expect(resolveErrorNames(refOperation, inlineOperationResolver(resolver, false))).toEqual(['HttpValidationError', 'Status500'])
  })

  test('inlineOperationResolver is a no-op when operationTypes is not false', () => {
    expect(inlineOperationResolver(resolver, true)).toBe(resolver)
    expect(inlineOperationResolver(resolver, undefined)).toBe(resolver)
    expect(resolveSuccessNames(refOperation, inlineOperationResolver(resolver, true))).toEqual(['Status200'])
  })

  test('resolveRequestTypeName inlines a $ref request body', () => {
    expect(resolveRequestTypeName({ node: refOperation, resolver })).toBe('addPetData')
    expect(resolveRequestTypeName({ node: refOperation, resolver, operationTypes: false })).toBe('Pet')
  })

  test('resolveOperationTypeImports tags inlined names with their schema', () => {
    const imports = resolveOperationTypeImports(refOperation, resolver, { operationTypes: false })
    expect(imports).toContainEqual({ name: 'Pet', schemaName: 'Pet' })
    expect(imports).toContainEqual({ name: 'HttpValidationError', schemaName: 'HttpValidationError' })
    expect(imports).toContainEqual({ name: 'Status500', schemaName: null })
  })

  test('groupOperationTypeImports groups inlined names by their schema file', () => {
    const imports = resolveOperationTypeImports(refOperation, resolver, { operationTypes: false })
    const groups = groupOperationTypeImports(imports, '/operations/AddPet.ts', (schemaName) => `/models/${schemaName}.ts`)
    const operationGroup = groups.find((group) => group.path === '/operations/AddPet.ts')
    expect(operationGroup?.names).toContain('Status500')
    expect(groups.find((group) => group.path === '/models/Pet.ts')?.names).toEqual(['Pet'])
  })
})

describe('getContentTypeInfo', () => {
  test('returns defaults for operations without a request body', () => {
    const node = ast.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(getContentTypeInfo(node)).toStrictEqual({
      contentTypes: [],
      isMultipleContentTypes: false,
      contentTypeUnion: '',
      defaultContentType: 'application/json',
      hasFormData: false,
    })
  })

  test('detects multiple content types and form data', () => {
    const node = ast.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: {
        content: [
          { contentType: 'application/json', schema: ast.createSchema({ type: 'object' }) },
          { contentType: 'multipart/form-data', schema: ast.createSchema({ type: 'object' }) },
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
    const node = ast.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: {
        content: [
          { contentType: 'application/json', schema: ast.createSchema({ type: 'object' }) },
          { contentType: 'application/xml', schema: ast.createSchema({ type: 'object' }) },
        ],
      },
    })

    expect(buildRequestConfigType(node, resolver)).toBe(
      'Partial<RequestConfig<createPetData>> & { client?: Client; contentType?: "application/json" | "application/xml" }',
    )
  })

  test('uses the untyped request config when no request schema exists', () => {
    const node = ast.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(buildRequestConfigType(node, resolver)).toBe('Partial<RequestConfig> & { client?: Client }')
  })
})

describe('buildOperationComments', () => {
  test('builds path-template links by default', () => {
    const node = ast.createOperation({
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
    const node = ast.createOperation({
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
  const node = ast.createOperation({
    operationId: 'createPet',
    method: 'POST',
    path: '/pets',
    responses: [
      ast.createResponse({ statusCode: '201', schema: ast.createSchema({ type: 'object' }) }),
      ast.createResponse({ statusCode: '400', schema: ast.createSchema({ type: 'object' }) }),
      ast.createResponse({ statusCode: 'default', schema: ast.createSchema({ type: 'object' }) }),
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
    const node = ast.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{pet-id}',
      parameters: [
        ast.createParameter({ name: 'pet-id', in: 'path', schema: ast.createSchema({ type: 'string' }) }),
        ast.createParameter({ name: 'page-size', in: 'query', schema: ast.createSchema({ type: 'number' }) }),
        ast.createParameter({ name: 'x-api-key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
        ast.createParameter({ name: 'session-id', in: 'cookie', schema: ast.createSchema({ type: 'string' }) }),
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
    const node = ast.createOperation({
      operationId: 'showPet',
      method: 'POST',
      path: '/pets/{pet-id}',
      parameters: [
        ast.createParameter({ name: 'pet-id', in: 'path', schema: ast.createSchema({ type: 'string' }) }),
        ast.createParameter({ name: 'page-size', in: 'query', schema: ast.createSchema({ type: 'number' }) }),
        ast.createParameter({ name: 'x-api-key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
      ],
      requestBody: {
        content: [{ contentType: 'application/json', schema: ast.createSchema({ type: 'object' }) }],
      },
      responses: [
        ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object' }) }),
        ast.createResponse({ statusCode: '400', schema: ast.createSchema({ type: 'object' }) }),
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
    const node = ast.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      responses: [
        ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object' }) }),
        ast.createResponse({ statusCode: '404', schema: ast.createSchema({ type: 'object' }) }),
      ],
    })

    expect(resolveOperationTypeNames(node, resolver, { responseStatusNames: 'error' })).toStrictEqual(['showPetResponse', 'Status404'])
  })
})
