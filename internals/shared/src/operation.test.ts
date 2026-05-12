import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import {
  buildOperationComments,
  buildRequestConfigType,
  findSuccessStatusCode,
  getContentTypeInfo,
  resolveErrorNames,
  resolveStatusCodeNames,
  type RequestConfigResolver,
  type ResponseStatusNameResolver,
} from './operation.ts'

const resolver: RequestConfigResolver & ResponseStatusNameResolver = {
  resolveDataName(node) {
    return `${node.operationId}Data`
  },
  resolveResponseStatusName(_node, statusCode) {
    return `Status${statusCode}`
  },
}

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

  test('finds the first success status code', () => {
    expect(findSuccessStatusCode(node.responses)).toBe('201')
  })

  test('resolves error response names', () => {
    expect(resolveErrorNames(node, resolver)).toStrictEqual(['Status400'])
  })

  test('resolves all response status names', () => {
    expect(resolveStatusCodeNames(node, resolver)).toStrictEqual(['Status201', 'Status400', 'Statusdefault'])
  })
})
