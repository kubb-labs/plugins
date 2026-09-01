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
  test('forwards the call config and casts to the operation RequestResult', () => {
    const callConfig = "{ method: 'POST', url: '/pet', ...config }"
    expect(buildReturnStatement({ node, types: resolverTs, callConfig, returnType: 'full' })).toBe(
      "return request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>",
    )
  })

  test('unwraps to the success body when returnType is data', () => {
    const callConfig = "{ method: 'POST', url: '/pet', ...config }"
    expect(buildReturnStatement({ node, types: resolverTs, callConfig, returnType: 'data' })).toBe(
      "return request({ method: 'POST', url: '/pet', ...config }).then((result) => (config.throwOnError ?? true ? result.data : result)) as Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>",
    )
  })
})
