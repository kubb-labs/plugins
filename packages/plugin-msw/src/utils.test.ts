import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { getExampleBody, getMockStatus, responseLiteral } from './utils.ts'

describe('getMockStatus', () => {
  test('mocks a range with the first code of its class', () => {
    expect(getMockStatus('201')).toBe(201)
    expect(getMockStatus('2XX')).toBe(200)
  })
})

describe('getExampleBody', () => {
  const json = (examples: Array<ast.ExampleNode>) =>
    ast.factory.createResponse({
      statusCode: '200',
      content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }), examples })],
    })

  test('parses a serialized JSON example, so the mock does not encode it twice', () => {
    expect(getExampleBody(json([{ serializedValue: '{"id":1}' }]))).toBe('{"id":1}')
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
})

describe('responseLiteral', () => {
  test('keeps the quotes of a header value', () => {
    expect(responseLiteral('body', 200, null, [['ETag', '"33a64df5"']])).toContain(`'ETag': '"33a64df5"'`)
  })
})
