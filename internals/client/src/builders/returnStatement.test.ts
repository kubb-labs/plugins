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
  test('wraps the call in withUnwrap and casts to the operation Unwrappable<RequestResult>', () => {
    const callConfig = "{ method: 'POST', url: '/pet', ...config }"
    expect(buildReturnStatement({ node, types: resolverTs, callConfig })).toBe(
      "return withUnwrap(request({ method: 'POST', url: '/pet', ...config })) as Unwrappable<RequestResult<AddPetResponses, ThrowOnError>>",
    )
  })
})
