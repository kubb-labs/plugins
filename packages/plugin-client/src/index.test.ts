import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { getRequestGroupOptionality, type RequestGroupOptionality } from './index.ts'

const stringSchema = ast.factory.createSchema({ type: 'string' })

describe('getRequestGroupOptionality', () => {
  test('marks the options argument required when a parameter is required', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', required: true, schema: stringSchema })],
    })

    expect(getRequestGroupOptionality(node)).toStrictEqual<RequestGroupOptionality>({
      groups: { path: true, query: false, body: false, headers: false, cookies: false },
      hasRequiredPath: true,
      hasRequiredQuery: false,
      hasRequiredHeader: false,
      isOptional: false,
    })
  })

  test('marks the options argument optional when every parameter is optional', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: stringSchema })],
    })

    const { groups, isOptional } = getRequestGroupOptionality(node)

    expect(groups.query).toBe(true)
    expect(isOptional).toBe(true)
  })

  test('reports no request group when the operation has no parameters or body', () => {
    const node = ast.factory.createOperation({ operationId: 'ping', method: 'GET', path: '/ping' })

    const { groups, isOptional } = getRequestGroupOptionality(node)

    expect(Object.values(groups).some(Boolean)).toBe(false)
    expect(isOptional).toBe(true)
  })
})
