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
})
