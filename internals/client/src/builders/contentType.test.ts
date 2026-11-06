import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildContentType } from './contentType.ts'

describe('buildContentType', () => {
  test('emits the request media type for a JSON string body', () => {
    const node = ast.factory.createOperation({
      operationId: 'postName',
      method: 'POST',
      path: '/x',
      requestBody: {
        required: true,
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'string' }) })],
      },
      responses: [],
    })

    expect(buildContentType({ node })).toStrictEqual({ literal: "contentType: { request: 'application/json' }", merge: false })
  })

  test('asks for text/event-stream on a stream, and keeps it when the caller picks a request type', () => {
    const stream = [
      ast.factory.createResponse({
        statusCode: '200',
        description: 'events',
        content: [ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'string' }) })],
      }),
    ]
    const get = ast.factory.createOperation({ operationId: 'events', method: 'GET', path: '/events', responses: stream })
    const post = ast.factory.createOperation({
      operationId: 'chat',
      method: 'POST',
      path: '/chat',
      requestBody: { content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })] },
      responses: stream,
    })

    expect(buildContentType({ node: get })).toStrictEqual({ literal: "contentType: { response: 'text/event-stream' }", merge: false })
    expect(buildContentType({ node: post })).toStrictEqual({
      literal:
        "contentType: { request: 'application/json', response: 'text/event-stream', ...(typeof contentType === 'string' ? { request: contentType } : contentType) }",
      merge: true,
    })
  })
})
