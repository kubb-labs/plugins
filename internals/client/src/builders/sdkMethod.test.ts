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
  test('builds the call config without remapping, since query param names already match the spec', () => {
    const method = buildSdkMethod({ node, name: 'updatePet', types: resolverTs, validator: undefined, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain("url: '/pets/{pet_id}', ...config")
    expect(method).not.toContain('include_deleted')
  })

  test('uses the same fallback for the request and data return type', () => {
    const method = buildSdkMethod({ node, name: 'updatePet', types: resolverTs, validator: undefined, returnType: 'data', throwOnErrorDefault: false })

    expect(method).toContain('public updatePet<ThrowOnError extends boolean = false>')
    expect(method).toContain('...config, throwOnError: config.throwOnError ?? false })')
    expect(method).toContain('config.throwOnError ?? false) as Promise<UnwrappedResult<UpdatePetResponses, ThrowOnError>>')
    expect(method).not.toContain('request.getConfig()')
  })

  test('bakes a non-JSON request content type into the call config', () => {
    const formNode = ast.factory.createOperation({
      operationId: 'postFoo',
      method: 'POST',
      path: '/foo',
      tags: ['foo'],
      requestBody: {
        required: true,
        content: [ast.factory.createContent({ contentType: 'application/x-www-form-urlencoded', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
      },
      responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
    })
    const method = buildSdkMethod({ node: formNode, name: 'postFoo', types: resolverTs, validator: undefined, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain("url: '/foo', contentType: { request: 'application/x-www-form-urlencoded' }, ...config")
  })
})
