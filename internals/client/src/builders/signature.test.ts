import { ast } from '@kubb/core'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildGroupedOptionsSignature } from './signature.ts'

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

const listPets = ast.factory.createOperation({
  operationId: 'listPets',
  method: 'GET',
  path: '/pets',
  tags: ['pet'],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildGroupedOptionsSignature', () => {
  test('emits a single grouped options parameter with a ThrowOnError generic', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.paramsSignature).toBe('options: Options<AddPetData, ThrowOnError>')
    expect(signature.generics).toStrictEqual(['ThrowOnError extends boolean = true'])
  })

  test('keys the return type on the plugin-ts per-status responses record', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.returnType).toBe('Promise<RequestResult<AddPetResponses, ThrowOnError>>')
  })

  test('derives the grouped data type from RequestConfig with the contract key names', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.dataTypeName).toBe('AddPetData')
    expect(signature.dataTypeDefinition).toContain("body: AddPetRequestConfig['data']")
    expect(signature.dataTypeDefinition).toContain("path?: AddPetRequestConfig['pathParams']")
    expect(signature.dataTypeDefinition).toContain("query?: AddPetRequestConfig['queryParams']")
    expect(signature.dataTypeDefinition).toContain("headers?: AddPetRequestConfig['headerParams']")
    expect(signature.dataTypeDefinition).toContain("url: AddPetRequestConfig['url']")
  })

  test('marks the body optional when the operation has no request body', () => {
    const signature = buildGroupedOptionsSignature({ node: listPets, tsResolver: resolverTs })
    expect(signature.dataTypeDefinition).toContain("body?: ListPetsRequestConfig['data']")
  })

  test('imports only the request-config and responses types', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.importedTypeNames).toStrictEqual(['AddPetRequestConfig', 'AddPetResponses'])
  })
})
