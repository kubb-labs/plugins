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
  parameters: [
    ast.factory.createParameter({
      name: 'limit',
      in: 'query',
      required: false,
      schema: ast.factory.createSchema({ type: 'integer' }),
    }),
  ],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildGroupedOptionsSignature', () => {
  test('emits a single grouped options parameter with a ThrowOnError generic', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.paramsSignature).toBe('options: Options<AddPetRequestConfig, ThrowOnError>')
    expect(signature.generics).toStrictEqual(['ThrowOnError extends boolean = true'])
  })

  test('defaults the options parameter when the operation has no required request data', () => {
    const signature = buildGroupedOptionsSignature({ node: listPets, tsResolver: resolverTs })
    expect(signature.paramsSignature).toBe('options: Options<ListPetsRequestConfig, ThrowOnError> = {}')
  })

  test('keys the return type on the plugin-ts per-status responses record', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.returnType).toBe('Promise<RequestResult<AddPetResponses, ThrowOnError>>')
  })

  test('uses the plugin-ts RequestConfig directly as the grouped data type', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.dataTypeName).toBe('AddPetRequestConfig')
  })

  test('imports only the request-config and responses types', () => {
    const signature = buildGroupedOptionsSignature({ node: addPet, tsResolver: resolverTs })
    expect(signature.importedTypeNames).toStrictEqual(['AddPetRequestConfig', 'AddPetResponses'])
  })
})
