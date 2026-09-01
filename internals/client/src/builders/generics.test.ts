import { ast } from 'kubb/kit'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildRequestResultGenerics, buildResultType } from './generics.ts'

const node = ast.factory.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildRequestResultGenerics', () => {
  test('names the responses record and threads ThrowOnError', () => {
    expect(buildRequestResultGenerics({ node, types: resolverTs })).toBe('GetPetByIdResponses, ThrowOnError')
  })
})

describe('buildResultType', () => {
  test('names RequestResult for the default full return type', () => {
    expect(buildResultType({ node, types: resolverTs, returnType: 'full' })).toBe('RequestResult<GetPetByIdResponses, ThrowOnError>')
  })

  test('names UnwrappedResult when returnType is data', () => {
    expect(buildResultType({ node, types: resolverTs, returnType: 'data' })).toBe('UnwrappedResult<GetPetByIdResponses, ThrowOnError>')
  })
})
