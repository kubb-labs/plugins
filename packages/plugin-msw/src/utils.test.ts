import { ast } from 'kubb/kit'
import { http } from 'msw'
import { describe, expect, test } from 'vitest'
import { getContentType, hasResponseSchema, resolveDefaultBaseURL } from './utils.ts'

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

describe('resolveDefaultBaseURL', () => {
  test('returns empty string literal when baseURL is undefined, null, or empty', () => {
    expect(resolveDefaultBaseURL(undefined)).toBe("''")
    expect(resolveDefaultBaseURL(null)).toBe("''")
    expect(resolveDefaultBaseURL('')).toBe("''")
  })

  test('returns template literal for dynamic template expressions', () => {
    expect(resolveDefaultBaseURL('${process.env.API_URL}')).toBe('`${process.env.API_URL}`')
    expect(resolveDefaultBaseURL('${123456}')).toBe('`${123456}`')
    expect(resolveDefaultBaseURL('${`nested`}')).toBe('`${\\`nested\\`}`')
  })

  test('returns JSON stringified string for static URLs', () => {
    expect(resolveDefaultBaseURL('http://localhost:3000')).toBe('"http://localhost:3000"')
    expect(resolveDefaultBaseURL('https://api.example.com/v1')).toBe('"https://api.example.com/v1"')
  })
})

describe('runtime MSW path resolution', () => {
  test('resolves relative path when options is undefined', () => {
    const options = undefined as { baseURL?: string } | undefined
    const handler = http.get(`${options?.baseURL ?? ''}/pets`, () => new Response(null))

    expect(handler.info.path).toBe('/pets')
  })

  test('resolves options.baseURL when provided', () => {
    const options = { baseURL: 'https://api.example.com' }
    const handler = http.get(`${options?.baseURL ?? ''}/pets`, () => new Response(null))

    expect(handler.info.path).toBe('https://api.example.com/pets')
  })

  test('options.baseURL overrides static base URL', () => {
    const staticBaseURL = 'http://localhost:3000'
    const options = { baseURL: 'https://override.example.com' }
    const handler = http.get(`${options?.baseURL ?? staticBaseURL}/pets`, () => new Response(null))

    expect(handler.info.path).toBe('https://override.example.com/pets')
  })
})
