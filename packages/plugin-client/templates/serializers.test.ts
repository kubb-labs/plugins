import { describe, expect, test } from 'vitest'
import { multipartFormData } from './mediaTypes/formData.ts'
import { multipartMixed } from './mediaTypes/mixed.ts'
import { urlencoded } from './mediaTypes/urlencoded.ts'
import { serializeCookies } from './serializers/cookies.ts'

const formMediaTypes = { 'multipart/form-data': multipartFormData, 'multipart/mixed': multipartMixed, 'application/x-www-form-urlencoded': urlencoded }

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
})

describe('multipart/mixed response decoding', () => {
  test('reads back the parts it encodes, JSON parts as values and text parts as text', async () => {
    const config = { styles: { parts: { prefix: [{ contentType: 'application/json' }], item: { contentType: 'text/plain' } } } }
    const body = formMediaTypes['multipart/mixed']!.encode!([{ id: 1 }, 'a\n\nb'], { contentType: 'multipart/mixed', config }) as Blob
    const response = new Response(body, { headers: { 'Content-Type': body.type } })

    expect(await formMediaTypes['multipart/mixed']!.decode!(response, { contentType: 'multipart/mixed', config: {} })).toStrictEqual([{ id: 1 }, 'a\n\nb'])
  })
})

describe('multipart/mixed body encoding', () => {
  test('sends each part with its media type and the boundary on the Content-Type', async () => {
    const config = { styles: { parts: { prefix: [{ contentType: 'application/json' }], item: { contentType: 'text/csv' } } } }
    const body = formMediaTypes['multipart/mixed']!.encode!([{ id: 1 }, 'a,b'], { contentType: 'multipart/mixed', config }) as Blob
    const boundary = body.type.match(/boundary=(.+)$/)?.[1]

    expect(body.type).toMatch(/^multipart\/mixed; boundary=kubb-/)
    expect(await body.text()).toBe(
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n{"id":1}\r\n--${boundary}\r\nContent-Type: text/csv\r\n\r\na,b\r\n--${boundary}--\r\n`,
    )
  })

  test('sends binary parts as bytes', async () => {
    const body = formMediaTypes['multipart/mixed']!.encode!([new Uint8Array([104, 105])], { contentType: 'multipart/mixed', config: {} }) as Blob
    const boundary = body.type.match(/boundary=(.+)$/)?.[1]

    expect(boundary).toMatch(/^kubb-[0-9a-f]{32}$/)
    expect(await body.text()).toBe(`--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\nhi\r\n--${boundary}--\r\n`)
  })

  test('sends the first type of a content type list', async () => {
    const config = { styles: { parts: { item: { contentType: 'image/png, image/jpeg' } } } }
    const body = formMediaTypes['multipart/mixed']!.encode!([new Uint8Array([1])], { contentType: 'multipart/mixed', config }) as Blob

    expect(await body.text()).toContain('Content-Type: image/png\r\n\r\n')
  })
})
