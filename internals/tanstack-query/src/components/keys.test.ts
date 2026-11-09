import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import type { KeyVariant } from '../types.ts'
import { mutationKeyTransformer } from './MutationKey.tsx'
import { queryKeyTransformer } from './QueryKey.tsx'

const getPetByIdNode = ast.factory.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'page', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) }),
  ],
})

const keys = (variant: KeyVariant, node: ast.OperationNode = getPetByIdNode) => queryKeyTransformer({ node, casing: 'camelcase', variant })

describe('queryKeyTransformer', () => {
  test('returns no entries for an operation without a path', () => {
    expect(keys('query', ast.factory.createOperation({ operationId: 'event' }))).toEqual([])
  })

  test('leaves cookies out of the key, since they often hold a session token', () => {
    const node = ast.factory.createOperation({
      operationId: 'getPrefs',
      method: 'GET',
      path: '/prefs',
      parameters: [ast.factory.createParameter({ name: 'theme', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }) })],
    })

    expect(keys('query', node)).toEqual(["{ url: '/prefs' }"])
  })
})

describe('mutationKeyTransformer', () => {
  test('returns no entries for an operation without a path', () => {
    expect(mutationKeyTransformer({ node: ast.factory.createOperation({ operationId: 'event' }), casing: 'camelcase', variant: 'mutation' })).toEqual([])
  })
})
