import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { getExampleBody, getMockHeaders, responseLiteral } from './utils.ts'

describe('getExampleBody', () => {
  const json = (examples: Array<ast.ExampleNode>) =>
    ast.factory.createResponse({
      statusCode: '200',
      content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }), examples })],
    })

  test('parses a serialized JSON example, so the mock does not encode it twice', () => {
    expect(getExampleBody(json([{ serializedValue: '{"id":1,"tags":["a\\nb"]}' }]))).toBe("{ id: 1, tags: ['a\\nb'] }")
    expect(getExampleBody(json([{ serializedValue: 'not json' }]))).toBeNull()
  })

  test('reads the example of the content type the mock sends', () => {
    const response = ast.factory.createResponse({
      statusCode: '200',
      content: [
        ast.factory.createContent({
          contentType: 'application/xml',
          schema: ast.factory.createSchema({ type: 'object' }),
          examples: [{ serializedValue: '<pet/>' }],
        }),
        ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })
    expect(getExampleBody(response)).toBeNull()
  })

  test('sends a serialized example as is for a text response, and skips it for a binary one', () => {
    const response = (contentType: string) =>
      ast.factory.createResponse({
        statusCode: '200',
        content: [ast.factory.createContent({ contentType, schema: ast.factory.createSchema({ type: 'object' }), examples: [{ serializedValue: '<pet/>' }] })],
      })
    expect(getExampleBody(response('application/xml'))).toBe("'<pet/>'")
    expect(getExampleBody(response('application/octet-stream'))).toBeNull()
  })

  test('leaves a serialized SSE example to the stream mock, so its events are not wrapped twice', () => {
    const response = ast.factory.createResponse({
      statusCode: '200',
      content: [
        ast.factory.createContent({
          contentType: 'text/event-stream',
          schema: ast.factory.createSchema({ type: 'string' }),
          examples: [{ serializedValue: 'data: hi\n\n' }],
        }),
      ],
    })
    expect(getExampleBody(response)).toBeNull()
  })
})

describe('getMockHeaders', () => {
  test('sends arrays and objects in the simple style', () => {
    const header = (name: string, value: unknown) =>
      ast.factory.createParameter({ name, in: 'header', required: false, schema: ast.factory.createSchema({ type: 'string' }), examples: [{ value }] })
    const response = ast.factory.createResponse({
      statusCode: '200',
      headers: [header('X-Ids', [1, 2]), header('X-Range', { from: 1, to: 2 }), header('X-Count', 3)],
    })

    expect(getMockHeaders(response)).toStrictEqual([
      ['X-Ids', '1,2'],
      ['X-Range', 'from,1,to,2'],
      ['X-Count', '3'],
    ])
  })

  test('leaves out a Content-Type header, which the mock already sends', () => {
    const response = ast.factory.createResponse({
      statusCode: '200',
      headers: [
        ast.factory.createParameter({
          name: 'content-type',
          in: 'header',
          required: false,
          schema: ast.factory.createSchema({ type: 'string' }),
          examples: [{ value: 'text/plain' }],
        }),
      ],
    })

    expect(getMockHeaders(response)).toStrictEqual([])
  })

  test('leaves out an example a header cannot carry', () => {
    const header = (name: string, value: string) =>
      ast.factory.createParameter({ name, in: 'header', required: false, schema: ast.factory.createSchema({ type: 'string' }), examples: [{ value }] })
    const response = ast.factory.createResponse({
      statusCode: '200',
      headers: [header('X-Multi', 'line1\nline2'), header('X-Name', 'Zoë ✓'), header('X-Latin', 'Zoë')],
    })

    expect(getMockHeaders(response)).toStrictEqual([['X-Latin', 'Zoë']])
    expect(() => new Headers(getMockHeaders(response))).not.toThrow()
  })
})

describe('responseLiteral', () => {
  test('keeps the quotes of a header value', () => {
    expect(responseLiteral('body', 200, null, [['ETag', '"33a64df5"']])).toContain(`'ETag': '"33a64df5"'`)
  })

  test('escapes a line break in a header value', () => {
    expect(responseLiteral('body', 200, null, [['Link', 'a\nb']])).toContain(`'Link': 'a\\nb'`)
  })
})
