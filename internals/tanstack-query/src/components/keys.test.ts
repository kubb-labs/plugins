import { ast } from 'kubb/kit'
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
  test.each(['query', 'suspenseQuery'] as const)('builds the plain key for %s', (variant) => {
    expect(keys(variant)).toEqual(["{ url: '/pet/:petId', params: path }", '...(query ? [query] : [])'])
  })

  test.each(['infiniteQuery', 'suspenseInfiniteQuery'] as const)('marks the key of %s as infinite', (variant) => {
    expect(keys(variant)).toEqual(["{ url: '/pet/:petId', params: path, infinite: true }", '...(query ? [query] : [])'])
  })

  test('adds the body when the operation has one', () => {
    const node = ast.factory.createOperation({
      operationId: 'searchPets',
      method: 'GET',
      path: '/pet/search',
      requestBody: ast.factory.createRequestBody({
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'string' }) })],
      }),
    })

    expect(keys('infiniteQuery', node)).toEqual(["{ url: '/pet/search', infinite: true }", '...(body ? [body] : [])'])
  })

  test('builds key for an operation without parameters', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pet',
    })

    expect(keys('query', node)).toEqual(["{ url: '/pet' }"])
    expect(keys('infiniteQuery', node)).toEqual(["{ url: '/pet', infinite: true }"])
  })

  test('returns no entries for an operation without a path', () => {
    expect(keys('query', ast.factory.createOperation({ operationId: 'event' }))).toEqual([])
  })
})

describe('mutationKeyTransformer', () => {
  test('builds the url key', () => {
    expect(mutationKeyTransformer({ node: getPetByIdNode, casing: 'camelcase', variant: 'mutation' })).toEqual(["{ url: '/pet/:petId' }"])
  })

  test('returns no entries for an operation without a path', () => {
    expect(mutationKeyTransformer({ node: ast.factory.createOperation({ operationId: 'event' }), casing: 'camelcase', variant: 'mutation' })).toEqual([])
  })
})
