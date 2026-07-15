import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { classifyOperation } from './utils.ts'

describe('classifyOperation', () => {
  test('classifies a GET as a query when methods include it', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(classifyOperation(node, { query: { methods: ['GET'], importPath: '@tanstack/react-query' }, mutation: false })).toStrictEqual({
      isQuery: true,
      isMutation: false,
    })
  })

  test('classifies a POST as a mutation when query does not claim the method', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, {
        query: { methods: ['GET'], importPath: '@tanstack/react-query' },
        mutation: { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' },
      }),
    ).toStrictEqual({ isQuery: false, isMutation: true })
  })

  test('a method claimed by query never counts as a mutation, even if mutation.methods also lists it', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, {
        query: { methods: ['POST'], importPath: '@tanstack/react-query' },
        mutation: { methods: ['POST'], importPath: '@tanstack/react-query' },
      }),
    ).toStrictEqual({ isQuery: true, isMutation: false })
  })

  test('query: false still marks every operation as a query', () => {
    const node = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(
      classifyOperation(node, { query: false, mutation: { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], importPath: '@tanstack/react-query' } }),
    ).toStrictEqual({ isQuery: true, isMutation: false })
  })
})
