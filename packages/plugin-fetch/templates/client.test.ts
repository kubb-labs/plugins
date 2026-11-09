import { describe, expect, test, vi } from 'vitest'
import {
  type Auth,
  type CallResult,
  type ClientConfig,
  createClient as createFetchClient,
  createClientCore,
  defaultTransport,
  createInterceptorStack,
  readResponse,
  type ResolvedRequest,
  toRequestInit,
  ResponseError,
  resolveAuth,
  resolveResponseType,
  type Transport,
  type TransportResult,
  unwrapResult,
  withUnwrap,
} from './client.ts'
import { applyHeaderStyles, defaultBodySerializer, defaultPathSerializer, defaultQuerySerializer, serializeCookies } from './serializers.ts'

type FakeResult = Partial<Pick<TransportResult, 'data' | 'status' | 'statusText'>>

function fakeTransport(result: FakeResult = {}) {
  const calls: Array<ResolvedRequest> = []
  const transport: Transport<string, string> = async (request) => {
    calls.push(request)
    return {
      data: result.data ?? { ok: true },
      status: result.status ?? 200,
      statusText: result.statusText ?? 'OK',
      headers: new Headers(),
      request: 'REQ',
      response: 'RES',
    }
  }
  return { transport, calls }
}

function createClient(result?: FakeResult) {
  const { transport, calls } = fakeTransport(result)
  const client = createClientCore<string, string>({ defaultTransport: transport })
  return { client, calls }
}

function toSchema<T>(transform: (value: unknown) => T) {
  return { '~standard': { validate: (value: unknown) => ({ value: transform(value) }) } }
}

function toFailingSchema(message = 'invalid') {
  return { '~standard': { validate: () => ({ issues: [{ message, path: ['name'] }] }) } }
}

describe('createInterceptorStack', () => {
  test('runs interceptors in registration order', async () => {
    const stack = createInterceptorStack<Array<string>>()
    stack.use((value) => [...value, 'a'])
    stack.use((value) => [...value, 'b'])
    expect(await stack.run([])).toStrictEqual(['a', 'b'])
  })

  test('eject removes an interceptor by id', async () => {
    const stack = createInterceptorStack<Array<string>>()
    const id = stack.use((value) => [...value, 'a'])
    stack.use((value) => [...value, 'b'])
    stack.eject(id)
    expect(await stack.run([])).toStrictEqual(['b'])
  })

  test('update swaps an interceptor in place without reordering', async () => {
    const stack = createInterceptorStack<Array<string>>()
    const id = stack.use((value) => [...value, 'a'])
    stack.use((value) => [...value, 'b'])
    stack.update(id, (value) => [...value, 'A'])
    expect(await stack.run([])).toStrictEqual(['A', 'b'])
  })

  test('keeps the value when a handler returns nothing, and stops at a result the guard rejects', async () => {
    const isList = (value: unknown): value is Array<string> => Array.isArray(value)
    const stack = createInterceptorStack<Array<string>, never, Array<string> | Error | void>(isList)
    const later = vi.fn((value: Array<string>) => [...value, 'c'])
    stack.use(() => undefined)
    stack.use((value) => [...value, 'b'])
    expect(await stack.run(['a'])).toStrictEqual(['a', 'b'])

    const mapped = new Error('mapped')
    stack.use(() => mapped)
    stack.use(later)
    expect(await stack.run(['a'])).toBe(mapped)
    expect(later).not.toHaveBeenCalled()
  })
})

describe('defaultQuerySerializer', () => {
  test('explodes arrays into repeated keys', () => {
    expect(defaultQuerySerializer({ tags: ['a', 'b'] })).toBe('tags=a&tags=b')
  })

  test('JSON-encodes a parameter with a JSON content type as one value', () => {
    const filter = { root: { nested: ['!#=~[]', 1] } }
    const query = defaultQuerySerializer({ filter, page: 2 }, { filter: { contentType: 'application/json' } })
    expect(query).toBe(`filter=${encodeURIComponent(JSON.stringify(filter))}&page=2`)
    expect(new URLSearchParams(query).get('filter')).toBe(JSON.stringify(filter))
  })

  test('sends a JSON querystring parameter as the whole query string, without its name', () => {
    const filter = { status: 'sold' }
    expect(defaultQuerySerializer({ filter }, { filter: { contentType: 'application/json', querystring: true } })).toBe(
      encodeURIComponent(JSON.stringify(filter)),
    )
  })

  test('fully encodes a JSON value even when allowReserved is set', () => {
    expect(defaultQuerySerializer({ f: { q: 'a&b#c' } }, { f: { contentType: 'application/json', allowReserved: true } })).toBe(
      `f=${encodeURIComponent('{"q":"a&b#c"}')}`,
    )
  })

  test('only treats application/json and +json media types as JSON', () => {
    const value = { a: 1 }
    expect(defaultQuerySerializer({ value }, { value: { contentType: 'application/vnd.api+json; charset=utf-8' } })).toBe(
      `value=${encodeURIComponent('{"a":1}')}`,
    )
    expect(defaultQuerySerializer({ value }, { value: { contentType: 'application/jsonl' } })).toBe('a=1')
  })

  test('serializes nested objects with the deepObject style', () => {
    expect(defaultQuerySerializer({ filter: { name: 'odie' } })).toBe('filter%5Bname%5D=odie')
  })

  test('skips undefined and null members', () => {
    expect(defaultQuerySerializer({ a: 1, b: undefined, c: null })).toBe('a=1')
  })

  test('form style without explode joins arrays with commas', () => {
    expect(defaultQuerySerializer({ id: [3, 4, 5] }, { id: { style: 'form', explode: false } })).toBe('id=3,4,5')
  })

  test('spaceDelimited and pipeDelimited join arrays without explode', () => {
    expect(defaultQuerySerializer({ id: [3, 4, 5] }, { id: { style: 'spaceDelimited', explode: false } })).toBe('id=3%204%205')
    expect(defaultQuerySerializer({ id: [3, 4, 5] }, { id: { style: 'pipeDelimited', explode: false } })).toBe('id=3|4|5')
  })

  test('form style with explode expands objects into top-level keys', () => {
    expect(defaultQuerySerializer({ filter: { role: 'admin', name: 'alex' } }, { filter: { style: 'form', explode: true } })).toBe('role=admin&name=alex')
  })

  test('form style without explode flattens objects with commas', () => {
    expect(defaultQuerySerializer({ filter: { role: 'admin', name: 'alex' } }, { filter: { style: 'form', explode: false } })).toBe(
      'filter=role,admin,name,alex',
    )
  })

  test('deepObject style renders bracketed object keys', () => {
    expect(defaultQuerySerializer({ filter: { role: 'admin' } }, { filter: { style: 'deepObject' } })).toBe('filter%5Brole%5D=admin')
  })

  test('deepObject style recurses into nested objects', () => {
    expect(defaultQuerySerializer({ a: { b: { c: 1 } } }, { a: { style: 'deepObject' } })).toBe('a%5Bb%5D%5Bc%5D=1')
  })

  test('serializes Date values as ISO-8601', () => {
    expect(defaultQuerySerializer({ since: new Date('2020-01-02T03:04:05.000Z') })).toBe('since=2020-01-02T03%3A04%3A05.000Z')
  })

  test('allowReserved leaves reserved characters unencoded', () => {
    expect(defaultQuerySerializer({ path: '/a/b' }, { path: { allowReserved: true } })).toBe('path=/a/b')
    expect(defaultQuerySerializer({ path: '/a/b' })).toBe('path=%2Fa%2Fb')
  })
})

describe('defaultPathSerializer', () => {
  test('simple style URL-encodes a primitive value', () => {
    expect(defaultPathSerializer({ name: 'id', value: 'a b' })).toBe('a%20b')
  })

  test('simple style joins array members with commas', () => {
    expect(defaultPathSerializer({ name: 'ids', value: [3, 4, 5] })).toBe('3,4,5')
  })

  test('simple style flattens objects to comma-separated key,value pairs', () => {
    expect(defaultPathSerializer({ name: 'point', value: { x: 1, y: 2 } })).toBe('x,1,y,2')
  })

  test('simple style with explode renders objects as key=value pairs', () => {
    expect(defaultPathSerializer({ name: 'point', value: { x: 1, y: 2 }, options: { explode: true } })).toBe('x=1,y=2')
  })

  test('label style prefixes a dot', () => {
    expect(defaultPathSerializer({ name: 'id', value: 5, options: { style: 'label' } })).toBe('.5')
    expect(defaultPathSerializer({ name: 'ids', value: [3, 4], options: { style: 'label' } })).toBe('.3,4')
    expect(defaultPathSerializer({ name: 'ids', value: [3, 4], options: { style: 'label', explode: true } })).toBe('.3.4')
    expect(defaultPathSerializer({ name: 'point', value: { x: 1, y: 2 }, options: { style: 'label', explode: true } })).toBe('.x=1.y=2')
  })

  test('matrix style prefixes a named segment', () => {
    expect(defaultPathSerializer({ name: 'id', value: 5, options: { style: 'matrix' } })).toBe(';id=5')
    expect(defaultPathSerializer({ name: 'id', value: [3, 4], options: { style: 'matrix' } })).toBe(';id=3,4')
    expect(defaultPathSerializer({ name: 'id', value: [3, 4], options: { style: 'matrix', explode: true } })).toBe(';id=3;id=4')
    expect(defaultPathSerializer({ name: 'point', value: { x: 1, y: 2 }, options: { style: 'matrix', explode: true } })).toBe(';x=1;y=2')
  })

  test('serializes undefined and null to an empty string', () => {
    expect(defaultPathSerializer({ name: 'id', value: undefined })).toBe('')
    expect(defaultPathSerializer({ name: 'id', value: null })).toBe('')
  })

  test('serializes a Date value as ISO-8601', () => {
    expect(defaultPathSerializer({ name: 'since', value: new Date('2020-01-02T03:04:05.000Z') })).toBe('2020-01-02T03%3A04%3A05.000Z')
  })
})

describe('defaultBodySerializer', () => {
  test.each(['application/json', 'application/json; charset=utf-8', 'application/vnd.api+json'])('JSON-encodes strings for %s', (contentType) => {
    expect(defaultBodySerializer({ body: 'a"b\nc', contentType })).toBe('"a\\"b\\nc"')
    expect(defaultBodySerializer({ body: '', contentType })).toBe('""')
  })

  test.each([undefined, 'text/plain', 'application/jsonl'])('passes strings through for %s', (contentType) => {
    expect(defaultBodySerializer({ body: 'abc', contentType })).toBe('abc')
  })

  test('ignores a JSON part contentType for urlencoded bodies', () => {
    const encoding = { meta: { contentType: 'application/json' } }
    expect(defaultBodySerializer({ body: { meta: { a: 1 } }, contentType: 'application/x-www-form-urlencoded', encoding })).toBe('a=1')
  })

  test('JSON-serializes plain objects', () => {
    expect(defaultBodySerializer({ body: { name: 'odie' } })).toBe('{"name":"odie"}')
  })

  test.each(['application/xml', 'text/xml; charset=utf-8', 'application/atom+xml', 'application/yaml', 'application/x-yaml', 'text/csv'])(
    'refuses to send an object as JSON under %s, and passes a string through',
    (contentType) => {
      expect(() => defaultBodySerializer({ body: { name: 'odie' }, contentType })).toThrow(TypeError)
      expect(() => defaultBodySerializer({ body: ['odie'], contentType })).toThrow(/codecs\['[a-z+/-]+'\]\.serialize/)
      expect(defaultBodySerializer({ body: '<pet/>', contentType })).toBe('<pet/>')
    },
  )

  test('JSON-encodes an object for a vendor type without a +json suffix', () => {
    expect(defaultBodySerializer({ body: { name: 'odie' }, contentType: 'application/vnd.acme.v1' })).toBe('{"name":"odie"}')
  })

  test('passes FormData through untouched', () => {
    const formData = new FormData()
    expect(defaultBodySerializer({ body: formData })).toBe(formData)
  })

  test.each([
    'application/x-www-form-urlencoded',
    'Application/X-WWW-Form-Urlencoded',
    'APPLICATION/X-WWW-FORM-URLENCODED',
    'Application/X-WWW-Form-Urlencoded; charset=UTF-8',
  ])('encodes objects as URLSearchParams for %s', (contentType) => {
    const body = defaultBodySerializer({ body: { a: '1' }, contentType })
    expect(body).toBeInstanceOf(URLSearchParams)
    expect(body?.toString()).toBe('a=1')
  })

  test.each(['multipart/form-data', 'Multipart/Form-Data', 'MULTIPART/FORM-DATA', 'Multipart/Form-Data; boundary=example'])(
    'builds FormData from a plain object for %s',
    (contentType) => {
      const body = defaultBodySerializer({ body: { field: 'x' }, contentType })
      expect(body).toBeInstanceOf(FormData)
      expect((body as FormData).get('field')).toBe('x')
    },
  )

  test('passes Blob members through and serializes dates, objects, and arrays in multipart', () => {
    const file = new Blob(['hi'], { type: 'text/plain' })
    const body = defaultBodySerializer({
      body: { file, when: new Date('2020-01-01T00:00:00.000Z'), meta: { a: 1 }, tags: ['a', 'b'] },
      contentType: 'multipart/form-data',
    }) as FormData
    expect(body.get('file')).toBeInstanceOf(Blob)
    expect(body.get('when')).toBe('2020-01-01T00:00:00.000Z')
    expect(body.get('meta')).toBe('{"a":1}')
    expect(body.getAll('tags')).toStrictEqual(['a', 'b'])
  })

  test('passes a pre-built FormData through untouched for multipart', () => {
    const formData = new FormData()
    expect(defaultBodySerializer({ body: formData, contentType: 'multipart/form-data' })).toBe(formData)
  })

  test('honors per-property encoding for urlencoded bodies', () => {
    const body = defaultBodySerializer({
      body: { tags: ['a', 'b'], filter: { x: 1 } },
      contentType: 'application/x-www-form-urlencoded',
      encoding: { tags: { style: 'form', explode: false }, filter: { style: 'deepObject' } },
    })
    expect(body).toBe('tags=a,b&filter%5Bx%5D=1')
  })

  test('emits a bigint as a JSON number', () => {
    expect(defaultBodySerializer({ body: { id: 42n } })).toBe('{"id":42}')
  })

  test('emits a bigint nested in a multipart part', () => {
    const body = defaultBodySerializer({ body: { meta: { id: 42n } }, contentType: 'multipart/form-data' }) as FormData
    expect(body.get('meta')).toBe('{"id":42}')
  })

  test('throws on a bigint outside the safe-integer range', () => {
    expect(() => defaultBodySerializer({ body: { id: 9007199254740993n } })).toThrow(/without losing precision/)
    expect(() => defaultBodySerializer({ body: { id: -9007199254740993n } })).toThrow(/without losing precision/)
  })

  test('applies a per-part content type from multipart encoding via a typed Blob', async () => {
    const body = defaultBodySerializer({
      body: { meta: { a: 1 } },
      contentType: 'multipart/form-data',
      encoding: { meta: { contentType: 'application/json' } },
    }) as FormData
    const part = body.get('meta')
    expect(part).toBeInstanceOf(Blob)
    expect((part as Blob).type).toBe('application/json')
    expect(await (part as Blob).text()).toBe('{"a":1}')
  })
})

describe('serializeCookies', () => {
  test('JSON-encodes a cookie with a JSON content type', () => {
    expect(serializeCookies({ prefs: { a: [1, 2] } }, { prefs: { contentType: 'application/json' } })).toBe(`prefs=${encodeURIComponent('{"a":[1,2]}')}`)
  })

  test('serializes primitives and arrays in form style', () => {
    expect(serializeCookies({ session: 'abc', ids: [1, 2] })).toBe('session=abc; ids=1,2')
  })

  test('explodes arrays and objects when explode is set', () => {
    expect(serializeCookies({ ids: [1, 2] }, { ids: { explode: true } })).toBe('ids=1; ids=2')
    expect(serializeCookies({ filter: { a: 1, b: 2 } }, { filter: { explode: true } })).toBe('a=1; b=2')
  })

  test('skips undefined and null members', () => {
    expect(serializeCookies({ a: 'x', b: undefined, c: null })).toBe('a=x')
  })
})

describe('applyHeaderStyles', () => {
  test('sends a header with a JSON content type as its JSON string', () => {
    const result = applyHeaderStyles(
      { 'X-Meta': { a: 1 }, 'X-Name': 'odie' },
      { 'X-Meta': { contentType: 'application/json' }, 'X-Name': { contentType: 'application/json' } },
    )
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-Meta': '{"a":1}', 'X-Name': '"odie"' })
  })

  test('escapes non-ASCII characters in a JSON header so it stays a valid header value', () => {
    const result = applyHeaderStyles({ 'X-Meta': { name: '日本' } }, { 'X-Meta': { contentType: 'application/json' } }) as Array<[string, string]>
    expect(result[0]?.[1]).toBe('{"name":"\\u65e5\\u672c"}')
    expect(JSON.parse(result[0]?.[1] ?? '')).toStrictEqual({ name: '日本' })
  })

  test('serializes array and object headers with the simple style', () => {
    const result = applyHeaderStyles({ 'X-Ids': [3, 4], 'X-Filter': { role: 'admin' } }, { 'X-Ids': { explode: false }, 'X-Filter': { explode: true } })
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-Ids': '3,4', 'X-Filter': 'role=admin' })
  })

  test('serializes a Date header value as ISO-8601', () => {
    const result = applyHeaderStyles({ 'X-Since': new Date('2020-01-02T03:04:05.000Z') }, { 'X-Since': {} })
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-Since': '2020-01-02T03:04:05.000Z' })
  })

  test('passes through primitives and headers without metadata untouched', () => {
    const result = applyHeaderStyles({ Authorization: 'Bearer x', 'X-Raw': [1, 2] }, { Authorization: { explode: true } })
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ Authorization: 'Bearer x', 'X-Raw': [1, 2] })
  })
})

describe('createClientCore', () => {
  test('returns errors for a non-throwing call and honors a per-call override', async () => {
    const { transport } = fakeTransport({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    const result = await unwrapResult(client({ method: 'GET', url: '/pet', throwOnError: false }), false)
    expect(result).toMatchObject({ status: 405, error: { message: 'invalid' } })
    await expect(client({ method: 'GET', url: '/pet', throwOnError: true })).rejects.toBeInstanceOf(ResponseError)
  })
  test('builds the url from method, path interpolation, and query', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet/{petId}', path: { petId: 7 }, query: { sort: 'name' } })
    expect(calls[0]?.url).toBe('/pet/7?sort=name')
    expect(calls[0]?.method).toBe('GET')
  })

  test('sends a QUERY request with its JSON body', async () => {
    const { client, calls } = createClient()
    await client({ method: 'QUERY', url: '/pet/search', body: { name: 'odie' } })
    expect(calls[0]?.method).toBe('QUERY')
    expect(calls[0]?.body).toBe('{"name":"odie"}')
  })

  test('serializes array and object path params instead of [object Object]', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet/{ids}/{point}', path: { ids: [3, 4], point: { x: 1, y: 2 } } })
    expect(calls[0]?.url).toBe('/pet/3,4/x,1,y,2')
  })

  test('honors per-parameter styles.path metadata', async () => {
    const { client, calls } = createClient()
    await client({
      method: 'GET',
      url: '/pet/{id}{filter}',
      path: { id: 5, filter: ['a', 'b'] },
      styles: { path: { id: { style: 'matrix' }, filter: { style: 'label' } } },
    })
    expect(calls[0]?.url).toBe('/pet/;id=5.a,b')
  })

  test('prefixes the client-level baseURL when the call does not set one', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, baseURL: 'https://api.test' })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.url).toBe('https://api.test/pet')
  })

  test('a per-call baseURL replaces the client-level baseURL', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, baseURL: 'https://api.test' })
    await client({ method: 'GET', url: '/pet', baseURL: 'https://override.test' })
    expect(calls[0]?.url).toBe('https://override.test/pet')
  })

  test('honors per-parameter styles.query metadata', async () => {
    const { client, calls } = createClient()
    await client({
      method: 'GET',
      url: '/pets',
      query: { id: [3, 4], filter: { a: 1 } },
      styles: { query: { id: { style: 'pipeDelimited', explode: false }, filter: { style: 'deepObject' } } },
    })
    expect(calls[0]?.url).toBe('/pets?id=3|4&filter%5Ba%5D=1')
  })

  test('JSON-encodes a string body and sets Content-Type', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/x', body: 'abc', contentType: { request: 'application/json' } })
    expect(calls[0]?.body).toBe('"abc"')
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
  })

  test('serializes the body and sets Content-Type', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/json' })
    expect(calls[0]?.body).toBe('{"name":"odie"}')
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
  })

  test('serializes JSON body without explicit contentType and sets Content-Type', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/v3/jwt/token/', body: { email: 'test@example.com', password: 'secret' } })
    expect(calls[0]?.body).toBe('{"email":"test@example.com","password":"secret"}')
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
  })

  test('does not override a caller-set Content-Type header', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, headers: { 'content-type': 'application/vnd.api+json' } })
    expect(calls[0]?.headers['content-type']).toBe('application/vnd.api+json')
    expect(calls[0]?.headers['Content-Type']).toBeUndefined()
  })

  test('does not auto-inject Content-Type when a custom bodySerializer is used', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, serializer: { body: ({ body }) => `custom:${JSON.stringify(body)}` } })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' } })
    expect(calls[0]?.body).toBe('custom:{"name":"odie"}')
    expect(calls[0]?.headers['Content-Type']).toBeUndefined()
  })

  test('serializes cookie params into the Cookie header', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet', cookies: { session: 'abc', ids: [1, 2] } })
    expect(calls[0]?.headers.Cookie).toBe('session=abc; ids=1,2')
  })

  test('appends cookie params to a Cookie header the caller set in any casing', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet', headers: { cookie: 'a=1' }, cookies: { session: 'abc' } })
    expect(calls[0]?.headers).toMatchObject({ cookie: 'a=1; session=abc' })
    expect(calls[0]?.headers.Cookie).toBeUndefined()
  })

  test('serializes array and object header params with the simple style', async () => {
    const { client, calls } = createClient()
    await client({
      method: 'GET',
      url: '/pet',
      headers: { 'X-Ids': [3, 4], 'X-Filter': { role: 'admin' } },
      styles: { header: { 'X-Ids': {}, 'X-Filter': { explode: true } } },
    })
    expect(calls[0]?.headers['X-Ids']).toBe('3,4')
    expect(calls[0]?.headers['X-Filter']).toBe('role=admin')
  })

  // `plugin-ts`'s `syntaxType: 'interface'` types path/headers/cookies params as interfaces, which
  // (unlike a type alias) get no implicit index signature, so `RequestConfig` must accept them too.
  test('accepts interface-typed path, headers, and cookies params', async () => {
    interface PetPath {
      petId: number
    }
    interface PetHeaders {
      'X-Request-Id': string
    }
    interface PetCookies {
      session: string
    }

    const { client, calls } = createClient()
    const path: PetPath = { petId: 7 }
    const headers: PetHeaders = { 'X-Request-Id': 'abc' }
    const cookies: PetCookies = { session: 'xyz' }
    await client({ method: 'GET', url: '/pet/{petId}', path, headers, cookies })

    expect(calls[0]?.url).toBe('/pet/7')
    expect(calls[0]?.headers['X-Request-Id']).toBe('abc')
    expect(calls[0]?.headers.Cookie).toBe('session=xyz')
  })

  test('builds FormData and omits Content-Type for multipart/form-data', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { field: 'x' }, contentType: 'multipart/form-data' })
    expect(calls[0]?.body).toBeInstanceOf(FormData)
    expect(calls[0]?.headers['Content-Type']).toBeUndefined()
  })

  test('removes every content-type spelling when a custom serializer returns FormData', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, headers: { 'cOnTeNt-TyPe': 'application/xml' } })
    const formData = new FormData()
    formData.append('field', 'x')
    await client({
      method: 'POST',
      url: '/pet',
      body: { field: 'x' },
      contentType: 'application/json',
      serializer: { body: () => formData },
    })
    expect(calls[0]?.body).toBe(formData)
    expect(calls[0]?.headers).toStrictEqual({})
  })

  test('omits Content-Type when a pre-built FormData body is sent', async () => {
    const { client, calls } = createClient()
    const formData = new FormData()
    formData.append('field', 'x')
    await client({ method: 'POST', url: '/pet', body: formData, contentType: 'application/json' })
    expect(calls[0]?.body).toBe(formData)
    expect(calls[0]?.headers['Content-Type']).toBeUndefined()
  })

  test('sets Content-Type for form-urlencoded bodies', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { a: '1' }, contentType: 'application/x-www-form-urlencoded' })
    expect(calls[0]?.body).toBeInstanceOf(URLSearchParams)
    expect(calls[0]?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
  })

  test('returns the success shape with data and an undefined error', async () => {
    const { client } = createClient({ data: { id: 1 }, status: 200 })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult<string, string>
    expect(result).toStrictEqual({
      status: 200,
      data: { id: 1 },
      error: undefined,
      contentType: undefined,
      request: 'REQ',
      response: 'RES',
    })
  })

  test('throws a ResponseError for a non-2xx status by default', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405, statusText: 'Method Not Allowed' })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 405, data: { message: 'invalid' } })
  })

  test('names the method and URL in the ResponseError message, without the query', async () => {
    const { client } = createClient({ status: 404, statusText: 'Not Found' })
    await expect(client({ method: 'GET', baseURL: 'https://api.test', url: '/pet/1', query: { api_key: 'secret' } })).rejects.toThrow(
      'GET https://api.test/pet/1 failed with status 404 Not Found',
    )
  })

  test('ResponseError keeps the bare message without a method or URL', () => {
    const error = new ResponseError({ data: undefined, status: 500, statusText: '', request: 'REQ', response: 'RES' })
    expect(error.message).toBe('Request failed with status 500')
  })

  test('ResponseError formats message with only method or only URL', () => {
    const errorMethodOnly = new ResponseError({ data: undefined, status: 500, statusText: 'Server Error', request: 'REQ', response: 'RES', method: 'POST' })
    expect(errorMethodOnly.message).toBe('POST failed with status 500 Server Error')

    const errorUrlOnly = new ResponseError({
      data: undefined,
      status: 404,
      statusText: 'Not Found',
      request: 'REQ',
      response: 'RES',
      url: 'https://api.test/pet',
    })
    expect(errorUrlOnly.message).toBe('https://api.test/pet failed with status 404 Not Found')
  })

  test('ResponseError.is matches by name, so an error from another bundled client still counts', () => {
    const foreign = Object.assign(new Error('boom'), { name: 'ResponseError' })
    expect(ResponseError.is(foreign)).toBe(true)
    expect(ResponseError.is(new ResponseError({ data: undefined, status: 500, statusText: '', request: 'REQ', response: 'RES' }))).toBe(true)
    expect(ResponseError.is(new Error('boom'))).toBe(false)
    expect(ResponseError.is({ name: 'ResponseError' })).toBe(false)
    expect(ResponseError.is(null)).toBe(false)
    expect(ResponseError.is(undefined)).toBe(false)
  })

  test('strips query parameters and hash fragments from URL in ResponseError message', async () => {
    const { client } = createClient({ status: 404, statusText: 'Not Found' })
    await expect(client({ method: 'GET', baseURL: 'https://api.test', url: '/pet/1?api_key=secret#details' })).rejects.toThrow(
      'GET https://api.test/pet/1 failed with status 404 Not Found',
    )
  })

  test('ResponseError.is acts as a type guard narrowing data and status', () => {
    const err: unknown = new ResponseError<{ message: string }>({
      data: { message: 'invalid' },
      status: 400,
      statusText: 'Bad Request',
      request: 'REQ',
      response: 'RES',
    })
    if (ResponseError.is(err)) {
      expect(err.status).toBe(400)
      expect(err.data).toStrictEqual({ message: 'invalid' })
      expect(err.statusText).toBe('Bad Request')
    } else {
      expect.fail('Expected ResponseError.is to return true')
    }
  })

  test('rethrows a transport network error without wrapping in ResponseError', async () => {
    const networkError = new TypeError('Failed to fetch')
    const transport = vi.fn(async () => {
      throw networkError
    })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await expect(client({ method: 'GET', url: '/pet/1' })).rejects.toBe(networkError)
  })

  test('passes client-level options to the transport', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, options: { cache: 'no-store' } })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.options).toStrictEqual({ cache: 'no-store' })
  })

  test('passes createClient credentials to the transport', async () => {
    const { transport, calls } = fakeTransport()
    const client = createFetchClient({ transport, credentials: 'include' })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.credentials).toBe('include')
  })

  test('prefers request-level credentials over client-level credentials', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, credentials: 'include' })
    await client({ method: 'GET', url: '/pet', credentials: 'omit' })
    expect(calls[0]?.credentials).toBe('omit')
  })

  test('leaves credentials undefined when neither level sets it', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.credentials).toBeUndefined()
  })

  test('merges request-level options over client-level', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, options: { cache: 'no-store', mode: 'cors' } })
    await client({ method: 'GET', url: '/pet', options: { cache: 'force-cache', next: { revalidate: 60 } } })
    expect(calls[0]?.options).toStrictEqual({ cache: 'force-cache', mode: 'cors', next: { revalidate: 60 } })
  })

  test('leaves options undefined when neither level sets it', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.options).toBeUndefined()
  })

  test('resolves the per-call transport over the default', async () => {
    const { client } = createClient()
    const override = fakeTransport({ data: { from: 'override' } })
    const result = (await client({ method: 'GET', url: '/pet', transport: override.transport })) as CallResult<string, string>
    expect(override.calls).toHaveLength(1)
    expect(result.data).toStrictEqual({ from: 'override' })
  })

  test('runs the request parser before the send and the response parser on success', async () => {
    const { client, calls } = createClient({ data: { raw: true }, status: 200 })
    const request = vi.fn((body: unknown) => ({ ...(body as object), validated: true }))
    const response = vi.fn(() => ({ parsed: true }))
    const result = (await client({
      method: 'POST',
      url: '/pet',
      body: { name: 'odie' },
      validator: { request: toSchema(request), response: toSchema(response) },
    })) as CallResult<string, string>
    expect(request).toHaveBeenCalledTimes(1)
    expect(calls[0]?.body).toBe('{"name":"odie","validated":true}')
    expect(result.data).toStrictEqual({ parsed: true })
  })

  test('skips the response parser on a non-2xx body', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405 })
    const response = vi.fn((value: unknown) => value)
    await client({ method: 'POST', url: '/pet', throwOnError: false, validator: { response: toSchema(response) } })
    expect(response).not.toHaveBeenCalled()
  })

  test('runs the error parser on a non-2xx body when throwOnError is false', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405 })
    const error = vi.fn(() => ({ parsed: true }))
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false, validator: { error: toSchema(error) } })) as CallResult<string, string>
    expect(error).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual({ status: 405, data: undefined, error: { parsed: true }, contentType: undefined, request: 'REQ', response: 'RES' })
  })

  test('runs the error parser only for the statuses in errorStatus when throwOnError is false', async () => {
    const validator = { error: toFailingSchema(), errorStatus: [404, '4XX'] }
    const gateway = createClient({ data: '<html>Bad Gateway</html>', status: 502 }).client
    const result = (await gateway({ method: 'GET', url: '/pet/1', throwOnError: false, validator })) as CallResult<string, string>
    expect(result).toMatchObject({ status: 502, data: undefined, error: '<html>Bad Gateway</html>' })

    for (const status of [404, 422]) {
      const { client } = createClient({ data: { message: 'missing' }, status })
      await expect(client({ method: 'GET', url: '/pet/1', throwOnError: false, validator })).rejects.toMatchObject({ name: 'ParseError' })
    }
    // Without errorStatus, as for a spec with a `default` response, every non-2xx body is validated.
    await expect(gateway({ method: 'GET', url: '/pet/1', throwOnError: false, validator: { error: toFailingSchema() } })).rejects.toMatchObject({
      name: 'ParseError',
    })
  })

  test('skips the error parser when the call throws, so it throws the ResponseError', async () => {
    const { client } = createClient({ data: '<html>Bad Gateway</html>', status: 502 })
    const error = vi.fn(() => ({ parsed: true }))
    await expect(client({ method: 'GET', url: '/pet/1', validator: { error: toFailingSchema() } })).rejects.toMatchObject({
      name: 'ResponseError',
      status: 502,
    })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { error: toSchema(error) } })).rejects.toMatchObject({ data: '<html>Bad Gateway</html>' })
    expect(error).not.toHaveBeenCalled()
  })

  test('throws the ParseError when no onValidationError is set', async () => {
    const { client } = createClient({ data: { id: 1 }, status: 200 })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })).rejects.toMatchObject({
      name: 'ParseError',
      issues: [{ message: 'invalid', path: ['name'] }],
    })
  })

  test('resolves with the substituted value when onValidationError returns one', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const onValidationError = vi.fn((_error: unknown, context: { value: unknown }) => ({ value: context.value }))
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError })
    const result = (await client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })) as CallResult<string, string>
    expect(result.data).toStrictEqual({ id: 1 })
    expect(onValidationError.mock.calls[0]?.[1]).toMatchObject({ direction: 'response', source: 'body', method: 'GET', status: 200, value: { id: 1 } })
  })

  test('rethrows when onValidationError returns nothing', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const onValidationError = vi.fn(() => undefined)
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
    expect(onValidationError).toHaveBeenCalledTimes(1)
  })

  test('skips every validator when the client sets validate to false', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const client = createClientCore<string, string>({ defaultTransport: transport, validate: false })
    const result = (await client({
      method: 'POST',
      url: '/pet',
      body: { name: 1 },
      query: { limit: 1 },
      validator: { request: toFailingSchema(), query: toFailingSchema(), response: toFailingSchema() },
    })) as CallResult<string, string>
    expect(result.data).toStrictEqual({ id: 1 })
  })

  test('skips only the directions the client turns off', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const client = createClientCore<string, string>({ defaultTransport: transport, validate: { response: false } })
    const result = (await client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })) as CallResult<string, string>
    expect(result.data).toStrictEqual({ id: 1 })
    await expect(client({ method: 'POST', url: '/pet', body: { name: 1 }, validator: { request: toFailingSchema() } })).rejects.toMatchObject({
      name: 'ParseError',
    })
  })

  test('keeps the validate setting of a call when setConfig changes it mid-flight', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const client = createClientCore<string, string>({
      defaultTransport: async (request) => {
        client.setConfig({ validate: false })
        return transport(request)
      },
    })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
  })

  test('lets a per-call validate override the client setting', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const client = createClientCore<string, string>({ defaultTransport: transport, validate: false })
    await expect(client({ method: 'GET', url: '/pet/1', validate: true, validator: { response: toFailingSchema() } })).rejects.toMatchObject({
      name: 'ParseError',
    })
  })

  test('reports a failing request body with the request direction', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const onValidationError = vi.fn(() => ({ value: { name: 'odie' } }))
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError })
    await client({ method: 'POST', url: '/pet', body: { name: 1 }, validator: { request: toFailingSchema() } })
    expect(onValidationError.mock.calls[0]?.[1]).toMatchObject({ direction: 'request', source: 'body', method: 'POST', url: '/pet', value: { name: 1 } })
  })

  test('prefers the per-call onValidationError over the client one', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const clientLevel = vi.fn(() => ({ value: 'client' }))
    const perCall = vi.fn(() => ({ value: 'call' }))
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError: clientLevel })
    const result = (await client({
      method: 'GET',
      url: '/pet/1',
      validator: { response: toFailingSchema() },
      onValidationError: perCall,
    })) as CallResult<string, string>
    expect(result.data).toBe('call')
    expect(clientLevel).not.toHaveBeenCalled()
  })

  test('skips the error parser on a success body', async () => {
    const { client } = createClient({ data: { id: 1 }, status: 200 })
    const error = vi.fn((value: unknown) => value)
    await client({ method: 'GET', url: '/pet/1', throwOnError: false, validator: { error: toSchema(error) } })
    expect(error).not.toHaveBeenCalled()
  })

  test('runs request and response interceptors', async () => {
    const { client, calls } = createClient()
    client.interceptors.request.use((request) => ({ ...request, headers: { ...request.headers, 'X-Trace': '1' } }))
    const seen: Array<number> = []
    client.interceptors.response.use((response) => {
      seen.push(response.status)
      return response
    })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.headers['X-Trace']).toBe('1')
    expect(seen).toStrictEqual([200])
  })

  test('runs the error interceptor before throwing', async () => {
    const { client } = createClient({ status: 500 })
    const onError = vi.fn((error: ResponseError<unknown, string, string>) => error)
    client.interceptors.error.use(onError)
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  test('throws the error an error interceptor returns, and the original when it returns nothing', async () => {
    const { client } = createClient({ status: 500 })
    const mapped = new Error('mapped')
    client.interceptors.error.use(() => mapped)
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBe(mapped)

    const { client: logging } = createClient({ status: 500 })
    logging.interceptors.error.use(() => undefined)
    await expect(logging({ method: 'GET', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
  })

  test('passes the ResponseError to every handler until one returns another error', async () => {
    class NotFound extends Error {}
    const { client } = createClient({ status: 404 })
    const seen: Array<number> = []
    client.interceptors.error.use((error) => void seen.push(error.status))
    client.interceptors.error.use((error) => (error.status === 404 ? new NotFound() : error))
    client.interceptors.error.use((error) => void seen.push(error.status))
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBeInstanceOf(NotFound)
    expect(seen).toStrictEqual([404])
  })

  test('setConfig merges and getConfig reflects it', () => {
    const { client } = createClient()
    client.setConfig({ baseURL: 'https://example.com' })
    expect(client.getConfig().baseURL).toBe('https://example.com')
  })

  test('setConfig keeps the entries of a Headers instance', () => {
    const { client } = createClient()
    client.setConfig({ headers: new Headers({ Authorization: 'Bearer t' }) })
    expect(client.getConfig().headers).toStrictEqual({ authorization: 'Bearer t' })
  })

  test('createClient produces an instance with isolated interceptors', () => {
    const { client } = createClient()
    const child = client.createClient()
    child.interceptors.request.use((request) => request)
    expect(child).not.toBe(client)
  })
})

describe('a streamed call answered without an event stream', () => {
  const answer = (body: string, contentType: string) => async () => new Response(body, { status: 200, headers: { 'content-type': contentType } })

  test.each(['application/json', 'application/problem+json'])('parses a %s body', async (contentType) => {
    using _fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(answer('{"ok":true}', contentType))
    const client = createClientCore({ defaultTransport })

    expect((await client({ method: 'GET', url: 'https://api.test/events', responseType: 'stream' })).data).toStrictEqual({ ok: true })
  })

  test('keeps a JSON-labeled body that is not JSON as text, and reads an empty one as no data', async () => {
    using _fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(answer('Pet deleted', 'application/json'))
    const client = createClientCore({ defaultTransport })

    expect((await client({ method: 'DELETE', url: 'https://api.test/pet/1' })).data).toBe('Pet deleted')
    _fetch.mockImplementation(answer('', 'application/json'))
    expect((await client({ method: 'DELETE', url: 'https://api.test/pet/1' })).data).toBeUndefined()
  })

  test('applies a catch-all map entry to a response without a Content-Type, after the exact type and the wildcard', () => {
    expect(resolveResponseType({ '*/*': 'blob' }, undefined)).toBe('blob')
    expect(resolveResponseType({ 'audio/*': 'blob', '*/*': 'text' }, 'video/mp4')).toBe('text')
    expect(resolveResponseType({ 'audio/*': 'blob', '*/*': 'text' }, 'audio/mpeg; codecs=mp3')).toBe('blob')
  })

  test('decodes the error body of a blob call by its content type, instead of returning a Blob', async () => {
    using _fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('{"message":"gone"}', { status: 404, headers: { 'content-type': 'application/json' } }))
    const client = createClientCore({ defaultTransport, throwOnError: false })

    expect((await client({ method: 'GET', url: 'https://api.test/image', responseType: 'blob' })).error).toStrictEqual({ message: 'gone' })
  })

  test('runs the response validator on a JSON body', async () => {
    using _fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(answer('{"ok":true}', 'application/json'))
    const client = createClientCore({ defaultTransport })

    const result = await client({ method: 'GET', url: 'https://api.test/events', responseType: 'stream', validator: { response: toSchema(() => 'validated') } })
    expect(result.data).toBe('validated')
  })

  test('keeps an application/x-ndjson body a stream', async () => {
    using _fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(answer('{"a":1}\n{"a":2}\n', 'application/x-ndjson'))
    const client = createClientCore({ defaultTransport })

    expect((await client({ method: 'GET', url: 'https://api.test/events', responseType: 'stream' })).data).toBeInstanceOf(ReadableStream)
  })

  test('decodes a text error body instead of handing the stream to the error path', async () => {
    using _fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('busy', { status: 503, headers: { 'content-type': 'text/plain' } }))
    const client = createClientCore({ defaultTransport })

    await expect(client({ method: 'GET', url: 'https://api.test/events', responseType: 'stream' })).rejects.toMatchObject({
      name: 'ResponseError',
      status: 503,
      data: 'busy',
    })
  })
})

describe('header merging', () => {
  // Client defaults and call headers are merged into one set for every request, with or without a headers
  // validator. Header names are case-insensitive, so each header is sent once.
  async function send(clientHeaders: unknown, request: Record<string, unknown>) {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, headers: clientHeaders as ClientConfig['headers'] })
    await client({ method: 'POST', url: '/pets', ...request })
    return calls[0]?.headers as Record<string, string>
  }

  test('sends client and call headers with distinct names, without a headers validator', async () => {
    const headers = await send({ 'X-Client': 'a' }, { headers: { 'X-Call': 'b' } })
    expect(headers).toMatchObject({ 'X-Client': 'a', 'X-Call': 'b' })
  })

  test('sends one header per name, the call winning over the client, without a headers validator', async () => {
    const headers = await send({ authorization: 'Bearer client' }, { headers: { Authorization: 'Bearer call' } })
    expect(Object.keys(headers).filter((key) => key.toLowerCase() === 'authorization')).toStrictEqual(['Authorization'])
    expect(headers.Authorization).toBe('Bearer call')
  })

  test('accepts array-form headers on the client and the call', async () => {
    const headers = await send([['X-Client', 'a']], { headers: [['X-Call', 'b']] })
    expect(headers).toMatchObject({ 'X-Client': 'a', 'X-Call': 'b' })
  })

  test('accepts Headers instances on the client and the call', async () => {
    const headers = await send(new Headers({ 'X-Client': 'a' }), { headers: new Headers({ 'X-Call': 'b' }) })
    expect(headers).toMatchObject({ 'x-client': 'a', 'x-call': 'b' })
  })

  test.each([undefined, null])('keeps the client value when the call sets the header to %s', async (value) => {
    const headers = await send({ 'X-Tenant': 'client' }, { headers: { 'X-Tenant': value } })
    expect(headers['X-Tenant']).toBe('client')
  })

  test('does not duplicate Content-Type when the client sets it in another casing', async () => {
    const headers = await send({ 'content-type': 'application/vnd.api+json' }, { body: { name: 'odie' } })
    expect(Object.keys(headers).filter((key) => key.toLowerCase() === 'content-type')).toStrictEqual(['content-type'])
    expect(headers['content-type']).toBe('application/vnd.api+json')
  })

  test('replaces a Content-Type in another casing with the operation content type', async () => {
    const headers = await send({ 'content-type': 'application/json' }, { body: { name: 'odie' }, contentType: 'application/merge-patch+json' })
    expect(Object.keys(headers).filter((key) => key.toLowerCase() === 'content-type')).toStrictEqual(['Content-Type'])
    expect(headers['Content-Type']).toBe('application/merge-patch+json')
  })

  test('sends no Content-Type when an optional body is left out', async () => {
    const headers = await send(undefined, { body: undefined, contentType: 'application/json' })
    expect(Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')).toBe(false)
  })
})

describe('params validators', () => {
  // Stands in for a generated encode schema: a `Date` goes in, its wire string comes out, and keys it
  // does not declare are dropped, the way a `z.object` strips them.
  const encodeDates = (keys: Array<string>, format: (date: Date) => string = (date) => date.toISOString()) =>
    toSchema((value) => Object.fromEntries(keys.filter((key) => key in (value as object)).map((key) => [key, format((value as Record<string, Date>)[key]!)])))
  // The same, keeping the keys it does not declare, as the generated `toHeadersStandardSchema(...)` validator does.
  const encodeDatesLoose = (keys: Array<string>) =>
    toSchema((value) => ({
      ...(value as object),
      ...Object.fromEntries(keys.filter((key) => key in (value as object)).map((key) => [key, (value as Record<string, Date>)[key]!.toISOString()])),
    }))

  test('skips the cookies validator when the call passes no cookies, since a browser sends them itself', async () => {
    const { client, calls } = createClient()
    const seen: Array<unknown> = []
    const cookies = toSchema((value) => {
      seen.push(value)
      return value
    })

    await client({ method: 'GET', url: '/cookies', validator: { cookies } })
    await client({ method: 'GET', url: '/cookies', cookies: { theme: 'dark' }, validator: { cookies } })

    expect(seen).toStrictEqual([{ theme: 'dark' }])
    expect(calls[0]?.headers['Cookie']).toBeUndefined()
  })

  test('sends no Cookie header when a cookies validator replaces the value with undefined', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/cookies', cookies: { theme: 'dark' }, validator: { cookies: toSchema(() => undefined) } })
    expect(calls[0]?.headers['Cookie']).toBeUndefined()
  })

  test('encodes the path, query, and headers before they are serialized', async () => {
    const { client, calls } = createClient()
    await client({
      method: 'PUT',
      url: '/events/{day}',
      path: { day: new Date('2026-10-01T00:00:00.000Z') },
      query: { after: new Date('2026-09-01T09:00:00.000Z') },
      headers: { 'X-Since': new Date('2026-08-01T00:00:00.000Z') },
      validator: {
        path: encodeDates(['day'], (date) => date.toISOString().slice(0, 10)),
        query: encodeDates(['after']),
        headers: encodeDates(['X-Since']),
      },
    })
    expect(calls[0]?.url).toBe('/events/2026-10-01?after=2026-09-01T09%3A00%3A00.000Z')
    expect(calls[0]?.headers['X-Since']).toBe('2026-08-01T00:00:00.000Z')
  })

  test('sends exactly what the query validator returns, so a key the schema drops stays dropped', async () => {
    const { client, calls } = createClient()
    await client({
      method: 'GET',
      url: '/events',
      query: { after: new Date('2026-09-01T00:00:00.000Z'), page: 2 },
      validator: { query: encodeDates(['after']) },
    })
    expect(calls[0]?.url).toBe('/events?after=2026-09-01T00%3A00%3A00.000Z')
  })

  test('sends the undeclared headers a headers validator keeps', async () => {
    const { client, calls } = createClient()
    await client({
      method: 'GET',
      url: '/events',
      headers: { 'X-Since': new Date('2026-08-01T00:00:00.000Z'), 'X-Trace': 'abc' },
      validator: { headers: encodeDatesLoose(['X-Since']) },
    })
    expect(calls[0]?.headers).toMatchObject({ 'X-Since': '2026-08-01T00:00:00.000Z', 'X-Trace': 'abc' })
  })

  test('validates the client headers together with the call headers', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, headers: { 'X-Tenant': 'acme', Authorization: 'Bearer token' } })
    const headers = vi.fn((value: unknown) => value)
    await client({ method: 'GET', url: '/events', headers: { 'X-Trace': 'abc' }, validator: { headers: toSchema(headers) } })
    expect(headers).toHaveBeenCalledWith({ 'X-Tenant': 'acme', Authorization: 'Bearer token', 'X-Trace': 'abc' })
    expect(calls[0]?.headers).toMatchObject({ 'X-Tenant': 'acme', Authorization: 'Bearer token', 'X-Trace': 'abc' })
  })

  test('collapses every spelling of a header into one key, the call winning', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, headers: { 'x-tenant': 'client' } })
    const headers = vi.fn((value: unknown) => value)
    await client({
      method: 'GET',
      url: '/events',
      headers: { 'X-TENANT': 'call', 'x-trace': 'abc' },
      validator: { headers: toSchema(headers) },
    })
    expect(headers).toHaveBeenCalledWith({ 'X-TENANT': 'call', 'x-trace': 'abc' })
  })

  test('sends the onValidationError substitute as is, without restoring the rejected params', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError: () => ({ value: {} }) })
    await client({ method: 'GET', url: '/pets', query: { limit: 'invalid' }, validator: { query: toFailingSchema() } })
    expect(calls[0]?.url).toBe('/pets')
  })

  test('validates an absent group as an empty object, so a missing required param still fails', async () => {
    const { client, calls } = createClient()
    const path = vi.fn((value: unknown) => value)
    await expect(client({ method: 'GET', url: '/events/{day}', validator: { path: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
    await client({ method: 'GET', url: '/events', validator: { query: toSchema(path) } })
    expect(path).toHaveBeenCalledWith({})
    expect(calls).toHaveLength(1)
  })

  test('adds apiKey query auth after the query is validated, so it never reaches the schema', async () => {
    const { client, calls } = createClient()
    const query = vi.fn((value: unknown) => value)
    await client({
      method: 'GET',
      url: '/events',
      query: { page: 1 },
      security: [{ type: 'apiKey', in: 'query', name: 'api_key' }],
      auth: 'secret',
      validator: { query: toSchema(query) },
    })
    expect(query).toHaveBeenCalledWith({ page: 1 })
    expect(calls[0]?.url).toBe('/events?page=1&api_key=secret')
  })

  test('reports a failing param with the request direction and its source', async () => {
    const { transport } = fakeTransport()
    const onValidationError = vi.fn(() => ({ value: { page: 1 } }))
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError })
    await client({ method: 'GET', url: '/events', query: { page: 'x' }, validator: { query: toFailingSchema() } })
    expect(onValidationError.mock.calls[0]?.[1]).toMatchObject({ direction: 'request', source: 'query', method: 'GET', url: '/events', value: { page: 'x' } })
  })

  test('getUrl serializes the params as passed, without running the validators', () => {
    const { client } = createClient()
    const path = vi.fn((value: unknown) => value)
    // @ts-expect-error getUrl takes no validator: it serializes the params as passed
    expect(client.getUrl({ url: '/events/{day}', path: { day: '2026-10-01' }, validator: { path: toSchema(path) } })).toBe('/events/2026-10-01')
    expect(path).not.toHaveBeenCalled()
  })
})

describe('content type negotiation', () => {
  function transportWith(result: FakeResult & { contentType?: string }) {
    const calls: Array<ResolvedRequest> = []
    const headers = new Headers(result.contentType ? { 'Content-Type': result.contentType } : {})
    const transport: Transport<string, string> = async (request) => {
      calls.push(request)
      return {
        data: result.data ?? { ok: true },
        status: result.status ?? 200,
        statusText: result.statusText ?? 'OK',
        headers,
        request: 'REQ',
        response: 'RES',
      }
    }
    return { transport, calls }
  }

  test('object-form contentType sets the request Content-Type and the Accept header', async () => {
    const { transport, calls } = transportWith({})
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: { request: 'application/json', response: 'application/xml' } })
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
    expect(calls[0]?.headers['Accept']).toBe('application/xml')
  })

  test('does not override a caller-set Accept header', async () => {
    const { transport, calls } = transportWith({})
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await client({ method: 'GET', url: '/pet', headers: { Accept: 'application/json' }, contentType: { response: 'application/xml' } })
    expect(calls[0]?.headers['Accept']).toBe('application/json')
  })

  test('preserves empty explicit headers over auth and content-type defaults', async () => {
    const { transport, calls } = transportWith({})
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await client({
      method: 'POST',
      url: '/pet',
      body: { name: 'odie' },
      headers: { authorization: '', accept: '', 'content-type': '' },
      contentType: { response: 'application/xml' },
      security: [{ type: 'http', scheme: 'bearer' }],
      auth: 'token',
    })
    expect(calls[0]?.headers).toStrictEqual({ authorization: '', accept: '', 'content-type': '' })
  })

  test('carries the negotiated content type onto result.contentType, charset stripped', async () => {
    const { transport } = transportWith({ data: { id: 1 }, contentType: 'application/xml; charset=utf-8' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult<string, string>
    expect(result.contentType).toBe('application/xml')
    expect(result.data).toStrictEqual({ id: 1 })
  })

  test.each([200, 422])('validates a codec-produced undefined value for status %s', async (status) => {
    const { transport } = transportWith({ data: 'raw', status, contentType: 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    const response = vi.fn(() => 'success')
    const error = vi.fn(() => 'failure')
    const result = await client({
      url: '/pet',
      throwOnError: false,
      codecs: { 'application/xml': { deserialize: async () => undefined } },
      validator: { response: toSchema(response), error: toSchema(error) },
    })
    const selected = status === 200 ? response : error
    const skipped = status === 200 ? error : response
    expect(selected).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(skipped).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      data: status === 200 ? 'success' : undefined,
      error: status === 200 ? undefined : 'failure',
    })
  })

  test.each([false, true])('keeps the selected validation recovery when a codec changes config (per-call: %s)', async (perCall) => {
    const { transport } = transportWith({ contentType: 'application/xml' })
    const initial = vi.fn(() => ({ value: 'initial' }))
    const override = vi.fn(() => ({ value: 'override' }))
    const replacement = vi.fn(() => ({ value: 'replacement' }))
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError: initial })
    const result = await client({
      url: '/pet',
      onValidationError: perCall ? override : undefined,
      validator: { response: toFailingSchema() },
      codecs: {
        'application/xml': {
          async deserialize(value) {
            client.setConfig({ onValidationError: replacement })
            await Promise.resolve()
            return value
          },
        },
      },
    })

    expect(result.data).toBe(perCall ? 'override' : 'initial')
    expect(perCall ? override : initial).toHaveBeenCalledOnce()
    expect(perCall ? initial : override).not.toHaveBeenCalled()
    expect(replacement).not.toHaveBeenCalled()
  })

  test.each([false, true])('keeps throwOnError=%s when a codec changes the client default', async (throwOnError) => {
    const { transport } = transportWith({ status: 422, contentType: 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport, throwOnError })
    const result = client({
      url: '/pet',
      codecs: {
        'application/xml': {
          async deserialize() {
            client.setConfig({ throwOnError: !throwOnError })
            await Promise.resolve()
            return 'decoded error'
          },
        },
      },
    })

    if (throwOnError) {
      await expect(result).rejects.toMatchObject({ name: 'ResponseError', data: 'decoded error', status: 422 })
      return
    }
    await expect(result).resolves.toMatchObject({ data: undefined, error: 'decoded error', status: 422 })
  })

  test('runs the matching deserializer before validation and feeds result.data', async () => {
    const { transport } = transportWith({ data: '<pet><id>1</id></pet>', contentType: 'application/xml' })
    const parseXml = vi.fn(() => ({ id: 1 }))
    const client = createClientCore<string, string>({ defaultTransport: transport, codecs: { 'application/xml': { deserialize: parseXml } } })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult<string, string>
    expect(parseXml).toHaveBeenCalledWith('<pet><id>1</id></pet>', 'application/xml')
    expect(result.data).toStrictEqual({ id: 1 })
    expect(result.contentType).toBe('application/xml')
  })

  test('matches a per-call deserializer over the client-level one, charset stripped', async () => {
    const { transport } = transportWith({ data: 'raw', contentType: 'application/xml; charset=utf-8' })
    const clientLevel = vi.fn(() => ({ from: 'client' }))
    const perCall = vi.fn(() => ({ from: 'call' }))
    const client = createClientCore<string, string>({ defaultTransport: transport, codecs: { 'application/xml': { deserialize: clientLevel } } })
    const result = (await client({ method: 'GET', url: '/pet/1', codecs: { 'application/xml': { deserialize: perCall } } })) as CallResult<string, string>
    expect(clientLevel).not.toHaveBeenCalled()
    expect(perCall).toHaveBeenCalledTimes(1)
    expect(result.data).toStrictEqual({ from: 'call' })
  })

  test('uses a per-content-type bodySerializer for the request body', async () => {
    const { transport, calls } = transportWith({})
    const toXml = vi.fn(() => '<pet/>')
    const client = createClientCore<string, string>({ defaultTransport: transport, codecs: { 'application/xml': { serialize: toXml } } })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/xml' })
    expect(toXml).toHaveBeenCalledWith({ name: 'odie' }, 'application/xml')
    expect(calls[0]?.body).toBe('<pet/>')
    expect(calls[0]?.headers['Content-Type']).toBe('application/xml')
  })

  test('carries the negotiated content type onto a thrown ResponseError', async () => {
    const { transport } = transportWith({ data: { message: 'bad' }, status: 422, contentType: 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 422, contentType: 'application/xml' })
  })
})

describe('defaultTransport binary responses', () => {
  const bytes = new Uint8Array([0xff, 0xfb, 0x90, 0x00])
  const responseTypes = { 'audio/mpeg': 'blob' as const, 'text/event-stream': 'stream' as const, 'application/vnd.custom': 'blob' as const }

  async function send(contentType: string, responseType: ResolvedRequest['responseType'] = responseTypes) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200, headers: { 'Content-Type': contentType } })),
    )
    return defaultTransport({ url: 'https://example.test/speech', method: 'POST', headers: {}, responseType })
  }

  test('returns a Blob for a mapped binary content type the media heuristic does not know', async () => {
    const result = await send('application/vnd.custom')
    expect(result.data).toBeInstanceOf(Blob)
    expect(new Uint8Array(await (result.data as Blob).arrayBuffer())).toEqual(bytes)
    expect(result.contentType).toBe('application/vnd.custom')
  })

  test('returns a Blob for audio/mpeg when the response also declares an event stream', async () => {
    const result = await send('audio/mpeg; charset=binary')
    expect(result.data).toBeInstanceOf(Blob)
    expect(result.data).not.toBeTypeOf('string')
    expect(new Uint8Array(await (result.data as Blob).arrayBuffer())).toEqual(bytes)
  })

  test('matches a type wildcard in the responseType map', async () => {
    const result = await send('audio/mpeg', { 'audio/*': 'blob' })
    expect(result.data).toBeInstanceOf(Blob)
  })

  test('keeps an event-stream body as a stream when it shares the response with audio', async () => {
    const result = await send('text/event-stream')
    expect(result.data).toBeInstanceOf(ReadableStream)
  })

  test('a string responseType overrides the map', async () => {
    const result = await send('audio/mpeg', 'text')
    expect(result.data).toBeTypeOf('string')
  })

  test('an exact JSON entry wins over a catch-all blob entry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ delta: 'hi' }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    )
    const result = await defaultTransport({
      url: 'https://example.test/speech',
      method: 'POST',
      headers: {},
      responseType: { 'application/json': 'json', '*/*': 'blob' },
    })
    expect(result.data).toStrictEqual({ delta: 'hi' })
  })

  test('passes the Next.js next option in the fetch init, which Request drops', async () => {
    const fetch = vi.fn(async (_input: Request, _init?: RequestInit) => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    await defaultTransport({ url: 'https://example.test/pet', method: 'GET', headers: {}, options: { next: { revalidate: 60 } } })
    expect(fetch.mock.calls[0]?.[1]).toStrictEqual({ next: { revalidate: 60 } })
  })

  test('keeps the bytes of a failed blob call with an unknown content type, and decodes a JSON one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 500, headers: { 'Content-Type': 'application/vnd.custom' } })),
    )
    const raw = await defaultTransport({ url: 'https://example.test/speech', method: 'GET', headers: {}, responseType: 'blob' })
    expect(raw.data).toBeInstanceOf(Blob)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"gone"}', { status: 404, headers: { 'Content-Type': 'application/json' } })),
    )
    const json = await defaultTransport({ url: 'https://example.test/speech', method: 'GET', headers: {}, responseType: 'blob' })
    expect(json.data).toStrictEqual({ message: 'gone' })
  })

  test('still parses JSON that the map leaves unset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ delta: 'hi' }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    )
    const result = await defaultTransport({
      url: 'https://example.test/speech',
      method: 'POST',
      headers: {},
      responseType: { 'application/vnd.custom': 'blob' },
    })
    expect(result.data).toStrictEqual({ delta: 'hi' })
  })
})

describe('a transport that returns a Response', () => {
  // A ky-like library: it returns a web `Response` without throwing on an error status.
  const respondWith =
    (response: Response): Transport =>
    async () =>
      response.clone()

  test('is read by the core as defaultTransport reads one', async () => {
    const ok = createClientCore({ defaultTransport: respondWith(new Response('{"id":1}', { headers: { 'Content-Type': 'application/json' } })) })
    const failed = createClientCore({
      defaultTransport: respondWith(new Response('{"message":"gone"}', { status: 404, headers: { 'Content-Type': 'application/json' } })),
      throwOnError: false,
    })
    const empty = createClientCore({ defaultTransport: respondWith(new Response(null, { status: 204 })) })

    expect(await ok({ method: 'GET', url: '/pet/1' })).toMatchObject({ data: { id: 1 }, status: 200, contentType: 'application/json' })
    expect(await failed({ method: 'GET', url: '/pet/1', responseType: 'blob' })).toMatchObject({ error: { message: 'gone' }, status: 404 })
    expect(await empty({ method: 'DELETE', url: '/pet/1' })).toMatchObject({ data: undefined, status: 204 })
  })

  test('carries a Request built from the resolved request, and response interceptors see the parsed result', async () => {
    const client = createClientCore({ defaultTransport: respondWith(new Response('{"id":1}', { headers: { 'Content-Type': 'application/json' } })) })
    const seen: Array<unknown> = []
    client.interceptors.response.use((result) => (seen.push(result.data), result))

    const result = await client({ method: 'GET', url: 'https://petstore.dev/pet/{petId}', path: { petId: 1 }, headers: { 'X-Trace': 'a' } })

    expect(seen).toStrictEqual([{ id: 1 }])
    expect(result.request).toBeInstanceOf(Request)
    expect((result.request as unknown as Request).headers.get('x-trace')).toBe('a')
    expect(result.response).toBeInstanceOf(Response)
  })

  test('builds that Request without the body, which was already sent', async () => {
    const client = createClientCore({ defaultTransport: respondWith(new Response('{}', { headers: { 'Content-Type': 'application/json' } })) })
    const result = await client({ method: 'POST', url: 'https://petstore.dev/pet', body: { name: 'odie' } })
    expect((result.request as unknown as Request).method).toBe('POST')
    expect((result.request as unknown as Request).body).toBeNull()
  })

  test('keeps the resolved request when the URL is relative, since a Request needs an absolute one', async () => {
    const client = createClientCore({ defaultTransport: respondWith(new Response('{}', { headers: { 'Content-Type': 'application/json' } })) })
    const result = await client({ method: 'GET', url: '/pet/1' })
    expect(result.request).toMatchObject({ url: '/pet/1', method: 'GET' })
  })

  test('reads a Response from a polyfill such as node-fetch, which is not instanceof the global one', async () => {
    const native = new Response('{"id":1}', { headers: { 'Content-Type': 'application/json' } })
    const headers = { get: (name: string) => native.headers.get(name) }
    const polyfilled = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers,
      body: native.body,
      text: () => native.text(),
      arrayBuffer: () => native.arrayBuffer(),
      blob: () => native.blob(),
    }
    const client = createClientCore({ defaultTransport: async () => polyfilled as unknown as Response })

    expect(await client({ method: 'GET', url: '/pet/1' })).toMatchObject({ data: { id: 1 }, status: 200, contentType: 'application/json' })
  })

  test('readResponse keeps the request it is given and the response as is', async () => {
    const response = new Response('ok', { headers: { 'Content-Type': 'text/plain' } })
    const result = await readResponse(response, { request: 'REQ' })
    expect(result).toMatchObject({ data: 'ok', request: 'REQ' })
    expect(result.response).toBe(response)
  })
})

describe('toRequestInit', () => {
  test('takes the signal from options when the call passes none at the top level', async () => {
    const { client, calls } = createClient()
    const controller = new AbortController()
    await client({ method: 'GET', url: '/pet', options: { signal: controller.signal } })
    expect(calls[0]?.signal).toBe(controller.signal)
  })

  test('puts the options first, so the resolved fields win', () => {
    const signal = new AbortController().signal
    const init = toRequestInit({
      url: '/pet',
      method: 'POST',
      headers: { 'X-A': '1' },
      body: '{}',
      signal,
      credentials: 'include',
      options: { cache: 'no-store', method: 'GET' },
    })
    expect(init).toStrictEqual({ cache: 'no-store', method: 'POST', headers: { 'X-A': '1' }, body: '{}', signal, credentials: 'include' })
  })

  test('leaves credentials out when the call sets none', () => {
    expect(toRequestInit({ url: '/pet', method: 'GET', headers: {} })).not.toHaveProperty('credentials')
  })
})

describe('getUrl', () => {
  test('interpolates path params and serializes the query', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, query: { status: ['a', 'b'] } })).toBe('/pet/7?status=a&status=b')
  })

  test('prefixes the configured baseURL', () => {
    const { client } = createClient()
    client.setConfig({ baseURL: 'https://example.com' })
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 1 } })).toBe('https://example.com/pet/1')
  })

  test('prefixes a per-call baseURL', () => {
    const { client } = createClient()
    expect(client.getUrl({ baseURL: 'https://example.com', url: '/pet' })).toBe('https://example.com/pet')
  })

  test('a per-call baseURL replaces the configured baseURL', () => {
    const { client } = createClient()
    client.setConfig({ baseURL: 'https://example.com' })
    expect(client.getUrl({ baseURL: 'https://override.test', url: '/pet' })).toBe('https://override.test/pet')
  })

  test('uses a per-call query serializer override', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pet', query: { a: 1 }, serializer: { query: () => 'custom=1' } })).toBe('/pet?custom=1')
  })

  test('uses a per-call path serializer override', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, serializer: { path: ({ value }) => `id-${value as string}` } })).toBe('/pet/id-7')
  })

  test('applies styles.path metadata to the matching placeholders', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, styles: { path: { petId: { style: 'matrix' } } } })).toBe('/pet/;petId=7')
  })

  test('applies styles.query metadata to the query string', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pets', query: { id: [3, 4, 5] }, styles: { query: { id: { style: 'spaceDelimited', explode: false } } } })).toBe(
      '/pets?id=3%204%205',
    )
  })
})

describe('unwrapResult', () => {
  test('narrows a success result to its data', async () => {
    const result = await unwrapResult(Promise.resolve({ data: { id: 1 }, error: undefined }), undefined)
    expect(result).toStrictEqual({ id: 1 })
  })
})

describe('withUnwrap', () => {
  test('unwrap() resolves to the success data', async () => {
    const result = await withUnwrap(Promise.resolve({ data: { id: 1 }, error: undefined })).unwrap()
    expect(result).toStrictEqual({ id: 1 })
  })

  test('unwrap() rejects with error for a non-throwing error result', async () => {
    await expect(withUnwrap(Promise.resolve({ data: undefined, error: { message: 'invalid' } })).unwrap()).rejects.toStrictEqual({ message: 'invalid' })
  })

  test('unwrap() rejects a failed call whose error body is empty, since the client reports the status as the error', async () => {
    const client = createClientCore({ defaultTransport: async () => new Response(null, { status: 404, statusText: 'Not Found' }), throwOnError: false })

    const result = await client({ method: 'GET', url: '/pet/1' })

    expect(result.error).toStrictEqual({ status: 404, statusText: 'Not Found' })
    await expect(withUnwrap(Promise.resolve(result)).unwrap()).rejects.toStrictEqual({ status: 404, statusText: 'Not Found' })
  })

  test.each([
    ['', 'text/html'],
    ['null', 'application/json'],
  ])('reports the status as the error when the error body is %j labeled %s', async (body, type) => {
    const response = new Response(body, { status: 404, statusText: 'Not Found', headers: { 'Content-Type': type } })
    const client = createClientCore({ defaultTransport: async () => response, throwOnError: false })

    const result = await client({ method: 'GET', url: '/status/404' })

    expect(result.error).toStrictEqual({ status: 404, statusText: 'Not Found' })
  })

  test('a rejected call propagates the rejection unchanged', async () => {
    const error = new ResponseError({ data: { message: 'invalid' }, status: 405, statusText: 'Method Not Allowed', request: 'REQ', response: 'RES' })
    await expect(withUnwrap(Promise.reject(error)).unwrap()).rejects.toBe(error)
  })
})

describe('resolveAuth', () => {
  test('places a bearer token on the Authorization header', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: () => 'token-123', headers, query: {} })
    expect(headers.Authorization).toBe('Bearer token-123')
  })

  test.each([
    ['user:pass', 'dXNlcjpwYXNz'],
    ['user:pässwörd', 'dXNlcjpww6Rzc3fDtnJk'],
    ['user:pässwörd€', 'dXNlcjpww6Rzc3fDtnJk4oKs'],
    ['用户:密码', '55So5oi3OuWvhueggQ=='],
    ['user:🔐', 'dXNlcjrwn5SQ'],
  ])('base64-encodes basic credential %s as UTF-8', async (auth, encoded) => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'basic' }], auth, headers, query: {} })
    expect(headers.Authorization).toBe(`Basic ${encoded}`)
  })

  test('resolves oauth2 as a bearer token', async () => {
    const headers: Record<string, string> = {}
    let receivedAuth: Auth | undefined
    await resolveAuth({
      security: [{ type: 'oauth2', scopes: ['read:pets'] }],
      auth: (auth) => {
        receivedAuth = auth
        return 'token-123'
      },
      headers,
      query: {},
    })
    expect(receivedAuth?.scopes).toStrictEqual(['read:pets'])
    expect(headers.Authorization).toBe('Bearer token-123')
  })

  test('places an api key in the header', async () => {
    const headers: Record<string, string> = {}
    const query: Record<string, unknown> = {}
    await resolveAuth({ security: [{ type: 'apiKey', name: 'X-API-Key', in: 'header' }], auth: () => 'secret', headers, query })
    expect(headers['X-API-Key']).toBe('secret')
    expect(query).toStrictEqual({})
  })

  test('places an api key in the query', async () => {
    const query: Record<string, unknown> = {}
    await resolveAuth({ security: [{ type: 'apiKey', name: 'api_key', in: 'query' }], auth: () => 'secret', headers: {}, query })
    expect(query).toStrictEqual({ api_key: 'secret' })
  })

  test('places an api key in the cookie', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'apiKey', name: 'sid', in: 'cookie' }], auth: () => 'secret', headers, query: {} })
    expect(headers.Cookie).toBe('sid=secret')
  })

  test('accepts a static token without a callback', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: 'token-123', headers, query: {} })
    expect(headers.Authorization).toBe('Bearer token-123')
  })

  test('awaits an async resolver', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: async () => 'token-123', headers, query: {} })
    expect(headers.Authorization).toBe('Bearer token-123')
  })

  test('applies the first scheme that resolves a token', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({
      security: [
        { type: 'http', scheme: 'bearer' },
        { type: 'apiKey', name: 'X-API-Key', in: 'header' },
      ],
      auth: (auth) => (auth.type === 'apiKey' ? 'secret' : undefined),
      headers,
      query: {},
    })
    expect(headers).toStrictEqual({ 'X-API-Key': 'secret' })
  })

  test('does nothing without an auth resolver', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: undefined, headers, query: {} })
    expect(headers).toStrictEqual({})
  })

  test('keeps an explicit Authorization header over the resolved bearer token', async () => {
    const headers: Record<string, string> = { Authorization: 'Bearer explicit' }
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: () => 'token-123', headers, query: {} })
    expect(headers).toStrictEqual({ Authorization: 'Bearer explicit' })
  })

  test('keeps an explicit lowercase authorization header over the resolved token', async () => {
    const headers: Record<string, string> = { authorization: 'Bearer explicit' }
    await resolveAuth({ security: [{ type: 'oauth2' }], auth: () => 'token-123', headers, query: {} })
    expect(headers).toStrictEqual({ authorization: 'Bearer explicit' })
  })

  test('keeps an explicit apiKey header over the resolved token', async () => {
    const headers: Record<string, string> = { 'x-api-key': 'explicit' }
    await resolveAuth({ security: [{ type: 'apiKey', name: 'X-API-Key', in: 'header' }], auth: () => 'secret', headers, query: {} })
    expect(headers).toStrictEqual({ 'x-api-key': 'explicit' })
  })

  test('keeps an explicit apiKey query value over the resolved token', async () => {
    const query: Record<string, unknown> = { api_key: 'explicit' }
    await resolveAuth({ security: [{ type: 'apiKey', name: 'api_key', in: 'query' }], auth: () => 'secret', headers: {}, query })
    expect(query).toStrictEqual({ api_key: 'explicit' })
  })
})
