import { ast } from 'kubb/kit'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildReturnStatement } from './returnStatement.ts'

const node = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildReturnStatement', () => {
  test('casts to RequestResult first, then wraps the call in withUnwrap', () => {
    const callConfig = "{ method: 'POST', url: '/pet', ...config }"
    expect(buildReturnStatement({ node, types: resolverTs, callConfig, returnType: 'full' })).toBe(
      "return withUnwrap(request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>)",
    )
  })

  test('routes the call through unwrapResult when returnType is data', () => {
    const callConfig = "{ method: 'POST', url: '/pet', ...config }"
    expect(buildReturnStatement({ node, types: resolverTs, callConfig, returnType: 'data' })).toBe(
      "return unwrapResult(request({ method: 'POST', url: '/pet', ...config }), config.throwOnError) as Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>",
    )
  })
})
