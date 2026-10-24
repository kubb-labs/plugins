import { ast } from 'kubb/kit'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildSdkMethod } from './SdkClient.tsx'

describe('buildSdkMethod', () => {
  test('bakes a non-JSON request content type into the call config', () => {
    const formNode = ast.factory.createOperation({
      operationId: 'postFoo',
      method: 'POST',
      path: '/foo',
      tags: ['foo'],
      requestBody: {
        required: true,
        content: [
          ast.factory.createContent({ contentType: 'application/x-www-form-urlencoded', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
        ],
      },
      responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
    })
    const method = buildSdkMethod({ node: formNode, name: 'postFoo', types: resolverTs, validatorHooks: null, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain("url: '/foo', contentType: { request: 'application/x-www-form-urlencoded' }, ...config")
  })
})
