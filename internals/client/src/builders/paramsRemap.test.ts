import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildParamsRemap } from './paramsRemap.ts'

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

describe('buildParamsRemap', () => {
  test('returns an empty array when every name is already camelCase', () => {
    const node = createOperation([
      { name: 'status', in: 'query', schema: stringSchema() },
      { name: 'petId', in: 'path', schema: stringSchema(), required: true },
    ])
    expect(buildParamsRemap({ node })).toStrictEqual([])
  })

  test('remaps a renamed query parameter back to the spec name', () => {
    const node = createOperation([{ name: 'include_deleted', in: 'query', schema: stringSchema() }])
    expect(buildParamsRemap({ node })).toStrictEqual(['query: config.query ? { "include_deleted": config.query.includeDeleted } : config.query'])
  })

  test('keeps unchanged query names alongside renamed ones', () => {
    const node = createOperation([
      { name: 'status', in: 'query', schema: stringSchema() },
      { name: 'page_size', in: 'query', schema: stringSchema() },
    ])
    expect(buildParamsRemap({ node })).toStrictEqual([
      'query: config.query ? { "status": config.query.status, "page_size": config.query.pageSize } : config.query',
    ])
  })

  test('remaps a renamed header parameter back to the spec name', () => {
    const node = createOperation([{ name: 'X-API-Key', in: 'header', schema: stringSchema() }])
    expect(buildParamsRemap({ node })).toStrictEqual(['headers: config.headers ? { "X-API-Key": config.headers.xAPIKey } : config.headers'])
  })

  test('ignores path parameters, which the URL template renames in sync', () => {
    const node = createOperation([{ name: 'pet_id', in: 'path', schema: stringSchema(), required: true }])
    expect(buildParamsRemap({ node })).toStrictEqual([])
  })

  test('keeps the first parameter when two names collapse to the same camelCased key', () => {
    const node = createOperation([
      { name: 'max-uploads', in: 'query', schema: stringSchema() },
      { name: 'MaxUploads', in: 'query', schema: stringSchema() },
    ])
    expect(buildParamsRemap({ node })).toStrictEqual(['query: config.query ? { "max-uploads": config.query.maxUploads } : config.query'])
  })
})
