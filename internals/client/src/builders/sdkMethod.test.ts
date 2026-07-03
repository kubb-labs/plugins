import { ast } from 'kubb/kit'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildSdkMethod } from './sdkMethod.ts'

const node = ast.factory.createOperation({
  operationId: 'updatePet',
  method: 'POST',
  path: '/pets/{pet_id}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({ name: 'pet_id', in: 'path', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createParameter({ name: 'include_deleted', in: 'query', required: false, schema: ast.factory.createSchema({ type: 'boolean' }) }),
  ],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
})

describe('buildSdkMethod', () => {
  test('remaps renamed query params to the spec names after the config spread', () => {
    const method = buildSdkMethod({ node, name: 'updatePet', tsResolver: resolverTs, validator: undefined })

    expect(method).toContain('...config, query: config.query ? { "include_deleted": config.query.includeDeleted } : config.query')
  })
})
