import { describe, expect, test } from 'vitest'
import { buildClientCallArgs, buildClientRequestArgs } from './callArgs.ts'

describe('buildClientCallArgs', () => {
  test('renders a value entry as `key: value`', () => {
    expect(buildClientCallArgs({ method: { value: "'GET'" } })).toBe("{ method: 'GET' }")
  })

  test('renders a value-less entry as the bare key', () => {
    expect(buildClientCallArgs({ query: {} })).toBe('{ query }')
  })

  test('renders a spread entry as `...value`, falling back to the key', () => {
    expect(buildClientCallArgs({ requestConfig: { value: 'requestConfig', spread: true } })).toBe('{ ...requestConfig }')
    expect(buildClientCallArgs({ requestConfig: { spread: true } })).toBe('{ ...requestConfig }')
  })

  test('drops null and undefined entries', () => {
    expect(buildClientCallArgs({ method: { value: "'GET'" }, body: null, query: undefined })).toBe("{ method: 'GET' }")
  })

  test('keeps entries in insertion order', () => {
    expect(buildClientCallArgs({ a: { value: '1' }, b: {}, c: { value: 'c', spread: true } })).toBe('{ a: 1, b, ...c }')
  })
})

describe('buildClientRequestArgs', () => {
  const base = {
    method: "'GET'",
    url: '`/pet`',
    query: { value: 'query' } as const,
    body: null,
    contentType: false,
    responseType: null,
  }

  test('spreads requestConfig first for the class client', () => {
    expect(buildClientRequestArgs({ ...base, requestConfigPlacement: 'first' })).toBe("{ ...requestConfig, method: 'GET', url: `/pet`, query: query }")
  })

  test('spreads requestConfig last for the function client', () => {
    expect(buildClientRequestArgs({ ...base, requestConfigPlacement: 'last' })).toBe("{ method: 'GET', url: `/pet`, query: query, ...requestConfig }")
  })

  test('omits requestConfig when placement is null', () => {
    expect(buildClientRequestArgs({ ...base, requestConfigPlacement: null })).toBe("{ method: 'GET', url: `/pet`, query: query }")
  })

  test('emits contentType as a shorthand and renders optional values', () => {
    expect(
      buildClientRequestArgs({
        ...base,
        baseURL: '`https://kubb.dev`',
        contentType: true,
        responseType: "'json'",
        headers: '{ ...headers }',
        requestConfigPlacement: null,
      }),
    ).toBe("{ method: 'GET', url: `/pet`, baseURL: `https://kubb.dev`, query: query, contentType, responseType: 'json', headers: { ...headers } }")
  })
})
