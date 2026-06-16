import { ast } from '@kubb/core'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildRequestResultGenerics } from './generics.ts'

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
    expect(buildRequestResultGenerics({ node, tsResolver: resolverTs })).toBe('GetPetByIdResponses, ThrowOnError')
  })
})
