import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { buildStyles } from './styles.ts'

function createOperation(parameters: Array<Parameters<typeof ast.factory.createParameter>[0]>) {
  return ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pet'],
    parameters: parameters.map((parameter) => ast.factory.createParameter(parameter)),
    responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
  })
}

const stringSchema = () => ast.factory.createSchema({ type: 'string' })

describe('buildStyles', () => {
  test('returns null when no parameter carries style or explode', () => {
    const node = createOperation([{ name: 'status', in: 'query', schema: stringSchema() }])
    expect(buildStyles({ node })).toBeNull()
  })

  test('emits path style and explode keyed by the camelCased name', () => {
    const node = createOperation([{ name: 'pet_id', in: 'path', schema: stringSchema(), style: 'matrix', explode: true }])
    expect(buildStyles({ node })).toBe("{ path: { petId: { style: 'matrix', explode: true } } }")
  })

  test('emits query style and explode', () => {
    const node = createOperation([{ name: 'tags', in: 'query', schema: stringSchema(), style: 'pipeDelimited', explode: false }])
    expect(buildStyles({ node })).toBe("{ query: { tags: { style: 'pipeDelimited', explode: false } } }")
  })

  test('emits only explode for header and cookie parameters', () => {
    const node = createOperation([
      { name: 'X-Ids', in: 'header', schema: stringSchema(), style: 'simple', explode: true },
      { name: 'session_id', in: 'cookie', schema: stringSchema(), explode: false },
    ])
    expect(buildStyles({ node })).toBe('{ header: { xIds: { explode: true } }, cookie: { sessionId: { explode: false } } }')
  })

  test('quotes a key whose camelCased name is not a bare identifier', () => {
    const node = createOperation([{ name: '2fa', in: 'query', schema: stringSchema(), explode: true }])
    expect(buildStyles({ node })).toBe('{ query: { "2Fa": { explode: true } } }')
  })

  test('groups multiple locations together', () => {
    const node = createOperation([
      { name: 'id', in: 'path', schema: stringSchema(), style: 'label', explode: false },
      { name: 'fields', in: 'query', schema: stringSchema(), explode: true },
    ])
    expect(buildStyles({ node })).toBe("{ path: { id: { style: 'label', explode: false } }, query: { fields: { explode: true } } }")
  })
})
