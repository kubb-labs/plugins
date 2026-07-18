import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import {
  buildOperationComments,
  buildOptionsSchema,
  buildRequestConfigType,
  findSuccessStatusCode,
  getContentTypeInfo,
  getOperationParameters,
  getOperationSuccessResponses,
  getPrimarySuccessResponse,
  getResponseType,
  getStatusCodeNumber,
  getSuccessResponses,
  isErrorStatusCode,
  isEventStream,
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
  param: {
    path(_node, param) {
      return `${param.name}PathParams`
    },
    query(_node, param) {
      return `${param.name}QueryParams`
    },
    headers(_node, param) {
      return `${param.name}HeaderParams`
    },
  },
  response: {
    body(node) {
      return `${node.operationId}Data`
    },
    response(node) {
      return `${node.operationId}Response`
    },
    status(_node, statusCode) {
      return `Status${statusCode}`
    },
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
  test('offers a request content type when the request body has multiple', () => {
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

    expect(buildRequestConfigType(node)).toBe(
      `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & { contentType?: { request?: "application/json" | "application/xml" } }`,
    )
  })

  test('offers a response content type when the success response has multiple', () => {
    const node = ast.factory.createOperation({
      operationId: 'getPet',
      method: 'GET',
      path: '/pets/{petId}',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
            ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object' }) }),
          ],
        }),
      ],
    })

    expect(buildRequestConfigType(node)).toBe(
      `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & { contentType?: { response?: "application/json" | "application/xml" } }`,
    )
  })

  test('offers both request and response content types when both are ambiguous', () => {
    const node = ast.factory.createOperation({
      operationId: 'updatePet',
      method: 'PUT',
      path: '/pets',
      requestBody: {
        content: [
          ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
          ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object' }) }),
        ],
      },
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
            ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object' }) }),
          ],
        }),
      ],
    })

    expect(buildRequestConfigType(node)).toBe(
      `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>> & { contentType?: { request?: "application/json" | "application/xml"; response?: "application/json" | "application/xml" } }`,
    )
  })

  test('uses the untyped request config when no request schema exists', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(buildRequestConfigType(node)).toBe(`Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>`)
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
  test('groups parameters by location, keeping every name exactly as in the OpenAPI spec', () => {
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

    const grouped = getOperationParameters(node)

    expect(grouped.path.map((param) => param.name)).toStrictEqual(['pet-id'])
    expect(grouped.query.map((param) => param.name)).toStrictEqual(['page-size'])
    expect(grouped.header.map((param) => param.name)).toStrictEqual(['x-api-key'])
    expect(grouped.cookie.map((param) => param.name)).toStrictEqual(['session-id'])
  })

  test('caches the grouped result per node so repeat calls for the same operation skip re-grouping', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) })],
    })

    expect(getOperationParameters(node)).toBe(getOperationParameters(node))
  })

  test('does not share cached results between distinct, structurally identical nodes', () => {
    const buildNode = () =>
      ast.factory.createOperation({
        operationId: 'showPet',
        method: 'GET',
        path: '/pets/{petId}',
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) })],
      })

    const grouped = getOperationParameters(buildNode())

    expect(getOperationParameters(buildNode())).not.toBe(grouped)
    expect(getOperationParameters(buildNode())).toStrictEqual(grouped)
  })
})

describe('buildOptionsSchema', () => {
  test('marks body, path, query, and headers as never when the operation has none of them', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    const schema = buildOptionsSchema(node, resolver)

    expect(schema.type).toBe('object')
    expect(schema.primitive).toBe('object')
    expect(schema.properties?.map((property) => ({ name: property.name, required: property.required, schemaType: property.schema.type }))).toStrictEqual([
      { name: 'body', required: false, schemaType: 'never' },
      { name: 'path', required: false, schemaType: 'never' },
      { name: 'query', required: false, schemaType: 'never' },
      { name: 'headers', required: false, schemaType: 'never' },
    ])
  })

  test('references the resolved body, path, query, and headers names when present', () => {
    const node = ast.factory.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets/{petId}',
      parameters: [
        ast.factory.createParameter({ name: 'petId', in: 'path', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'limit', in: 'query', required: false, schema: ast.factory.createSchema({ type: 'integer' }) }),
        ast.factory.createParameter({ name: 'x-api-key', in: 'header', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
      requestBody: { content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })] },
    })

    const schema = buildOptionsSchema(node, resolver)

    expect(
      schema.properties?.map((property) => ({
        name: property.name,
        required: property.required,
        ref: property.schema.type === 'ref' ? property.schema.name : null,
      })),
    ).toStrictEqual([
      { name: 'body', required: true, ref: 'createPetData' },
      { name: 'path', required: true, ref: 'petIdPathParams' },
      { name: 'query', required: false, ref: 'limitQueryParams' },
      { name: 'headers', required: true, ref: 'x-api-keyHeaderParams' },
    ])
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

    expect(resolveOperationTypeNames(node, resolver, { exclude: ['Status200'] })).toStrictEqual([
      'pet-idPathParams',
      'page-sizeQueryParams',
      'x-api-keyHeaderParams',
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

describe('getResponseType / isEventStream', () => {
  function nodeWithResponseContentType(mediaType: string): ast.OperationNode {
    return ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [ast.factory.createResponse({ statusCode: '200', mediaType, schema: ast.factory.createSchema({ type: 'object' }) })],
    })
  }

  test('maps text/event-stream to a stream responseType', () => {
    expect(getResponseType(nodeWithResponseContentType('text/event-stream'))).toBe('stream')
    expect(isEventStream(nodeWithResponseContentType('text/event-stream'))).toBe(true)
  })

  test('ignores a charset suffix on the content type', () => {
    expect(getResponseType(nodeWithResponseContentType('text/event-stream; charset=utf-8'))).toBe('stream')
    expect(isEventStream(nodeWithResponseContentType('text/event-stream; charset=utf-8'))).toBe(true)
  })

  test('leaves JSON responses to the runtime auto-detection', () => {
    expect(getResponseType(nodeWithResponseContentType('application/json'))).toBeUndefined()
    expect(isEventStream(nodeWithResponseContentType('application/json'))).toBe(false)
  })

  test('maps other non-JSON content types to text or blob', () => {
    expect(getResponseType(nodeWithResponseContentType('text/plain'))).toBe('text')
    expect(getResponseType(nodeWithResponseContentType('application/octet-stream'))).toBe('blob')
    expect(isEventStream(nodeWithResponseContentType('application/octet-stream'))).toBe(false)
  })
})
