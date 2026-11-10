import { describe, expect, test } from 'vitest'
import { formMediaTypes } from './mediaTypes.ts'
import { serializeCookies } from './serializers.ts'

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
})
