import { describe, expect, test } from 'vitest'
import { multipartFormData } from './mediaTypes/formData.ts'
import { urlencoded } from './mediaTypes/urlencoded.ts'
import { serializeCookies } from './serializers/cookies.ts'
import { serializeStyledPath } from './serializers/pathStyles.ts'
import { serializeStyledQuery } from './serializers/queryStyles.ts'

const formMediaTypes = { 'multipart/form-data': multipartFormData, 'application/x-www-form-urlencoded': urlencoded }

describe('urlencoded body serialization', () => {
  test('uses query defaults without encoding metadata', () => {
    const body = { d: new Date(0), o: { a: 1 }, arr: ['x', 'y'], nil: null, missing: undefined, zero: 0, flag: false, text: 'a b' }
    const result = formMediaTypes['application/x-www-form-urlencoded']?.encode?.(body, { contentType: 'application/x-www-form-urlencoded', config: {} })

    expect(result).toBeInstanceOf(URLSearchParams)
    expect(result?.toString()).toBe('d=1970-01-01T00%3A00%3A00.000Z&o%5Ba%5D=1&arr=x&arr=y&zero=0&flag=false&text=a+b')
  })
})

describe('cookie serialization', () => {
  test('percent-encodes form cookies and sends cookie-style values as they are', () => {
    expect(serializeCookies({ sid: 'a b', ids: ['x;', 'y'] })).toBe('sid=a%20b; ids=x%3B,y')
    expect(serializeCookies({ sid: 'a%20b', ids: ['x', 'y'] }, { sid: { style: 'cookie' }, ids: { style: 'cookie' } })).toBe('sid=a%20b; ids=x; ids=y')
    expect(serializeCookies({ ids: ['x', 'y'] }, { ids: { style: 'cookie', explode: false } })).toBe('ids=x,y')
  })

  test('throws on a cookie-style value that would add a cookie of its own', () => {
    expect(() => serializeCookies({ sid: 'x; admin=1' }, { sid: { style: 'cookie' } })).toThrow(
      new TypeError('Cookie sid has characters the cookie style cannot send, escape it first.'),
    )
    expect(() => serializeCookies({ prefs: { 'a; admin': '1' } }, { prefs: { style: 'cookie' } })).toThrow(TypeError)
    // `=` is a valid value octet but would split `a=b=1` into cookie `a`.
    expect(() => serializeCookies({ prefs: { 'a=b': '1' } }, { prefs: { style: 'cookie' } })).toThrow(
      new TypeError('Cookie prefs has a key the cookie style cannot send as a cookie name, escape it first.'),
    )
    expect(serializeCookies({ prefs: { theme: 'a=b' } }, { prefs: { style: 'cookie' } })).toBe('theme=a=b')
  })

  test('percent-encodes an exploded form key so it cannot add a cookie', () => {
    expect(serializeCookies({ prefs: { 'a; admin': '1' } }, { prefs: { explode: true } })).toBe('a%3B%20admin=1')
  })

  test('adds no empty segment for an empty exploded array or object', () => {
    expect(serializeCookies({ a: 1, b: [], c: {}, d: 2 }, { b: { style: 'cookie' }, c: { style: 'cookie' } })).toBe('a=1; d=2')
  })
})

describe('OpenAPI style examples', () => {
  const color = { R: 100, G: 200, B: 150 }

  test('percent-encodes the pipeDelimited delimiter and joins objects with the style delimiter', () => {
    expect(serializeStyledQuery({ color }, { color: { style: 'pipeDelimited', explode: false } })).toBe('color=R%7C100%7CG%7C200%7CB%7C150')
    expect(serializeStyledQuery({ color }, { color: { style: 'spaceDelimited', explode: false } })).toBe('color=R%20100%20G%20200%20B%20150')
  })

  test('defaults explode to false for spaceDelimited and pipeDelimited', () => {
    expect(serializeStyledQuery({ ids: [1, 2] }, { ids: { style: 'pipeDelimited' } })).toBe('ids=1%7C2')
    expect(serializeStyledQuery({ ids: [1, 2] }, { ids: { style: 'spaceDelimited' } })).toBe('ids=1%202')
    expect(serializeStyledQuery({ color }, { color: { style: 'pipeDelimited' } })).toBe('color=R%7C100%7CG%7C200%7CB%7C150')
    expect(serializeStyledQuery({ ids: [1, 2] }, { ids: { style: 'form' } })).toBe('ids=1&ids=2')
    const body = { ids: [1, 2] }
    const config = { styles: { body: { ids: { style: 'pipeDelimited' as const } } } }
    expect(String(formMediaTypes['application/x-www-form-urlencoded']!.encode!(body, { contentType: 'application/x-www-form-urlencoded', config }))).toBe(
      'ids=1%7C2',
    )
    expect((formMediaTypes['multipart/form-data']!.encode!(body, { contentType: 'multipart/form-data', config }) as FormData).getAll('ids')).toStrictEqual([
      '1|2',
    ])
  })

  test('allowReserved keeps percent-encoded triples and encodes a stray %', () => {
    expect(serializeStyledQuery({ q: 'a%20b/c', p: '100%' }, { q: { allowReserved: true }, p: { allowReserved: true } })).toBe('q=a%20b/c&p=100%25')
  })

  test('sends a string querystring as the whole query', () => {
    expect(serializeStyledQuery({ selector: '$.a.b[1:1]' }, { selector: { contentType: 'application/jsonpath', querystring: true } })).toBe(
      '%24.a.b%5B1%3A1%5D',
    )
    expect(serializeStyledQuery({ qs: 'foo=a+%2B+b' }, { qs: { contentType: 'application/x-www-form-urlencoded', querystring: true } })).toBe('foo=a+%2B+b')
  })

  test('sends an empty matrix value without `=`', () => {
    expect(serializeStyledPath({ name: 'color', value: '', options: { style: 'matrix' } })).toBe(';color')
  })
})

describe('multipart/form-data body encoding', () => {
  test('sends a string as JSON in an application/json part', async () => {
    const config = { styles: { body: { id: { contentType: 'application/json' } } } }
    const part = (formMediaTypes['multipart/form-data']!.encode!({ id: 'f81d' }, { contentType: 'multipart/form-data', config }) as FormData).get('id') as Blob

    expect(part.type).toBe('application/json')
    expect(await part.text()).toBe('"f81d"')
  })
})
