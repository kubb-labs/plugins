import { ast } from 'kubb/kit'
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
})
