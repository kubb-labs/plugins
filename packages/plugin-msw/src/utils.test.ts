import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { getContentType, hasResponseSchema } from './utils.ts'

describe('response schema utilities', () => {
  test('treats a placeholder unknown schema without a content type as bodyless', () => {
    const response = ast.factory.createResponse({
      statusCode: '200',
      description: 'OK',
      schema: ast.factory.createSchema({ type: 'unknown' }),
    })

    expect(hasResponseSchema(response)).toBe(false)
    expect(getContentType(response)).toBe(null)
  })
})
