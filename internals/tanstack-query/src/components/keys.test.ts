import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import type { KeyVariant, Transformer } from '../types.ts'
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

    expect(keys('infiniteQuery', node)).toEqual(["{ url: '/pet/search', infinite: true }", '...(body !== undefined ? [body] : [])'])
  })

  test('keeps a falsy body in the key of a QUERY operation', () => {
    const node = ast.factory.createOperation({
      operationId: 'searchPets',
      method: 'QUERY',
      path: '/pet/search',
      requestBody: ast.factory.createRequestBody({
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'string' }) })],
      }),
    })
    const [, bodyEntry] = keys('query', node)
    const keyFor = (body: unknown) => new Function('body', `return [${bodyEntry}]`)(body)

    // '' and null are different inputs, so they must not share a cache entry.
    expect(keyFor('')).toEqual([''])
    expect(keyFor(null)).toEqual([null])
    expect(keyFor(undefined)).toEqual([])
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

  test('can be extended by a custom builder', () => {
    const queryKey: Transformer = (props) => [JSON.stringify(props.node.operationId), ...queryKeyTransformer(props)]

    expect(queryKey({ node: getPetByIdNode, casing: 'camelcase', variant: 'query' })).toEqual([
      '"getPetById"',
      "{ url: '/pet/:petId', params: path }",
      '...(query ? [query] : [])',
    ])
  })
})

describe('mutationKeyTransformer', () => {
  test('builds the url key', () => {
    expect(mutationKeyTransformer({ node: getPetByIdNode, casing: 'camelcase', variant: 'mutation' })).toEqual(["{ url: '/pet/:petId' }"])
  })

  test('returns no entries for an operation without a path', () => {
    expect(mutationKeyTransformer({ node: ast.factory.createOperation({ operationId: 'event' }), casing: 'camelcase', variant: 'mutation' })).toEqual([])
  })

  test('can be extended by a custom builder', () => {
    const mutationKey: Transformer = (props) => [JSON.stringify(props.node.operationId), ...mutationKeyTransformer(props)]

    expect(mutationKey({ node: getPetByIdNode, casing: 'camelcase', variant: 'mutation' })).toEqual(['"getPetById"', "{ url: '/pet/:petId' }"])
  })
})
