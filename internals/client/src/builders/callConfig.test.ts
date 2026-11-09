import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildCallConfig } from './callConfig.ts'

describe('buildCallConfig', () => {
  test('emits a content-type map when one response mixes a binary body with an event stream', () => {
    const node = ast.factory.createOperation({
      operationId: 'speech',
      method: 'POST',
      path: '/speech',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'audio/mpeg', schema: ast.factory.createSchema({ type: 'blob' }) }),
            ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
          ],
        }),
      ],
    })

    const { callConfig, eventStream } = buildCallConfig({ node, validatorHooks: null, throwOnErrorDefault: true, returnType: 'full' })

    expect(eventStream).toBe(false)
    expect(callConfig).toContain(`responseType: { "audio/mpeg": 'blob', "text/event-stream": 'stream' }`)
    expect(callConfig).toContain('...config')
  })

  test('keeps a string responseType when every content type parses as a blob', () => {
    const node = ast.factory.createOperation({
      operationId: 'speech',
      method: 'POST',
      path: '/speech',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'audio/mpeg', schema: ast.factory.createSchema({ type: 'blob' }) }),
            ast.factory.createContent({ contentType: 'audio/wav', schema: ast.factory.createSchema({ type: 'blob' }) }),
          ],
        }),
      ],
    })

    const { callConfig } = buildCallConfig({ node, validatorHooks: null, throwOnErrorDefault: true, returnType: 'full' })

    expect(callConfig).toContain(`responseType: 'blob'`)
    expect(callConfig).not.toContain('audio/mpeg')
  })

  test('merges a per-call validator and styles with the generated ones per key', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      parameters: [
        ast.factory.createParameter({ name: 'tags', in: 'query', schema: ast.factory.createSchema({ type: 'string' }), explode: false }),
        ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'string' }), explode: true }),
      ],
      responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
    })
    const validatorHooks = {
      request: null,
      path: null,
      query: null,
      headers: null,
      cookies: null,
      response: 'responseSchema',
      error: null,
      importedZodNames: [],
    }

    const { callConfig } = buildCallConfig({ node, validatorHooks, throwOnErrorDefault: true, returnType: 'full' })
    const evaluate = new Function('config', 'responseSchema', `return ${callConfig}`)
    const config = { validator: { request: 'bodySchema' }, styles: { query: { tags: { explode: true } }, header: { 'X-Id': { explode: true } } } }

    expect(evaluate(config, 'responseSchema')).toMatchObject({
      validator: { request: 'bodySchema', response: 'responseSchema' },
      styles: { query: { tags: { explode: true }, limit: { explode: true } }, header: { 'X-Id': { explode: true } } },
    })
    expect(evaluate({}, 'responseSchema')).toMatchObject({ validator: { response: 'responseSchema' }, styles: { query: { tags: { explode: false } } } })
  })
})
