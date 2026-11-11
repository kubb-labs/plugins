import { describe, expect, test, vi } from 'vitest'
import {
  type Auth,
  type ClientConfig,
  createClient as createFetchClient,
  createClientCore as createCore,
  createLazyClient,
  defaultMediaTypes,
  defaultTransport,
  createInterceptorStack,
  isResponseError,
  type MediaTypeContext,
  type MediaTypes,
  type RequestConfig,
  type ResolvedRequest,
  toRequestInit,
  ResponseError,
  resolveAuth,
  resolveMediaType,
  resolveThrowOnError,
  type Transport,
  unwrapResult,
  withUnwrap,
} from './client.ts'
import type { BodyEncoding } from './serializers.ts'
import { serializeCookies } from '../../plugin-client/templates/serializers/cookies.ts'
import { serializeHeaders } from '../../plugin-client/templates/serializers/headers.ts'
import { serializeStyledPath } from '../../plugin-client/templates/serializers/pathStyles.ts'
import { serializeStyledQuery } from '../../plugin-client/templates/serializers/queryStyles.ts'
import { serializePath } from '../../plugin-client/templates/serializers/path.ts'
import { serializeQuery } from '../../plugin-client/templates/serializers/query.ts'
import { multipartFormData } from '../../plugin-client/templates/mediaTypes/formData.ts'
import { urlencoded } from '../../plugin-client/templates/mediaTypes/urlencoded.ts'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'

const formMediaTypes = { 'multipart/form-data': multipartFormData, 'application/x-www-form-urlencoded': urlencoded }

const serializers = { query: serializeStyledQuery, path: serializeStyledPath, header: serializeHeaders, cookie: serializeCookies }

// `.kubb/client.ts` registers the serializers of a spec. These tests register all of them.
function createClientCore<TRequest = Request, TResponse = Response>(options: Parameters<typeof createCore<TRequest, TResponse>>[0]) {
  return createCore<TRequest, TResponse>({ ...options, serializer: { ...serializers, ...options.serializer } })
}

type FakeResult = { data?: unknown; status?: number; statusText?: string; contentType?: string }

/** A transport that answers every call with `data` as JSON, or as text when it is a string. */
function fakeTransport(result: FakeResult = {}) {
  const calls: Array<ResolvedRequest> = []
  const transport: Transport<string, string> = async (request) => {
    calls.push(request)
    const data = result.data ?? { ok: true }
    const contentType = result.contentType ?? (typeof data === 'string' ? 'text/plain' : 'application/json')
    const webResponse = new Response(typeof data === 'string' ? data : JSON.stringify(data), {
      status: result.status ?? 200,
      statusText: result.statusText ?? 'OK',
      headers: { 'content-type': contentType },
    })
    return { webResponse, request: 'REQ', response: 'RES' }
  }
  return { transport, calls }
}

/** Encodes a body as the client would for `contentType`, with the form media types registered. */
function encodeBody({ body, contentType, encoding }: { body: unknown; contentType?: string; encoding?: Record<string, BodyEncoding> }) {
  const mediaType = resolveMediaType({ mediaTypes: { ...defaultMediaTypes, ...formMediaTypes }, contentType: contentType ?? '*/*', use: 'encode' })
  return mediaType?.encode?.(body, { contentType: contentType ?? '', config: { styles: { body: encoding } } })
}

function createClient(result?: FakeResult) {
  const { transport, calls } = fakeTransport(result)
  const client = createClientCore<string, string>({
    defaultTransport: transport,
    mediaTypes: formMediaTypes,
  })
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

  test('keeps the value when a handler returns nothing, and hands the next handler what the one before returned', async () => {
    const stack = createInterceptorStack<Error, never, Error | void>()
    const later = vi.fn((value: Error) => value)
    stack.use(() => undefined)
    expect(await stack.run(new Error('a'))).toMatchObject({ message: 'a' })

    const mapped = new Error('mapped')
    stack.use(() => mapped)
    stack.use(later)
    expect(await stack.run(new Error('a'))).toBe(mapped)
    expect(later).toHaveBeenCalledWith(mapped, undefined)
  })
})

describe('serializeQuery and serializeStyledQuery', () => {
  test('explodes arrays into repeated keys', () => {
    expect(serializeStyledQuery({ tags: ['a', 'b'] })).toBe('tags=a&tags=b')
  })

  test('JSON-encodes a parameter with a JSON content type as one value', () => {
    const filter = { root: { nested: ['!#=~[]', 1] } }
    const query = serializeStyledQuery({ filter, page: 2 }, { filter: { contentType: 'application/json' } })
    expect(query).toBe(`filter=${encodeURIComponent(JSON.stringify(filter))}&page=2`)
    expect(new URLSearchParams(query).get('filter')).toBe(JSON.stringify(filter))
  })

  test('sends a JSON querystring parameter as the whole query string, without its name', () => {
    const filter = { status: 'sold' }
    expect(serializeStyledQuery({ filter }, { filter: { contentType: 'application/json', querystring: true } })).toBe(
      encodeURIComponent(JSON.stringify(filter)),
    )
  })

  test('fully encodes a JSON value even when allowReserved is set', () => {
    expect(serializeStyledQuery({ f: { q: 'a&b#c' } }, { f: { contentType: 'application/json', allowReserved: true } })).toBe(
      `f=${encodeURIComponent('{"q":"a&b#c"}')}`,
    )
  })

  test('only treats application/json and +json media types as JSON', () => {
    const value = { a: 1 }
    expect(serializeStyledQuery({ value }, { value: { contentType: 'application/vnd.api+json; charset=utf-8' } })).toBe(
      `value=${encodeURIComponent('{"a":1}')}`,
    )
    expect(serializeStyledQuery({ value }, { value: { contentType: 'application/jsonl' } })).toBe('a=1')
  })

  test('serializes an object without a style as form with explode', () => {
    expect(serializeStyledQuery({ filter: { name: 'odie', age: 3 } })).toBe('name=odie&age=3')
  })

  test('skips undefined and null members', () => {
    expect(serializeStyledQuery({ a: 1, b: undefined, c: null })).toBe('a=1')
  })

  test('form style without explode joins arrays with commas', () => {
    expect(serializeStyledQuery({ id: [3, 4, 5] }, { id: { style: 'form', explode: false } })).toBe('id=3,4,5')
  })

  test('spaceDelimited and pipeDelimited join arrays without explode', () => {
    expect(serializeStyledQuery({ id: [3, 4, 5] }, { id: { style: 'spaceDelimited', explode: false } })).toBe('id=3%204%205')
    expect(serializeStyledQuery({ id: [3, 4, 5] }, { id: { style: 'pipeDelimited', explode: false } })).toBe('id=3%7C4%7C5')
  })

  test('form style with explode expands objects into top-level keys', () => {
    expect(serializeStyledQuery({ filter: { role: 'admin', name: 'alex' } }, { filter: { style: 'form', explode: true } })).toBe('role=admin&name=alex')
  })

  test('form style without explode flattens objects with commas', () => {
    expect(serializeStyledQuery({ filter: { role: 'admin', name: 'alex' } }, { filter: { style: 'form', explode: false } })).toBe('filter=role,admin,name,alex')
  })

  test('deepObject style renders bracketed object keys', () => {
    expect(serializeStyledQuery({ filter: { role: 'admin' } }, { filter: { style: 'deepObject' } })).toBe('filter%5Brole%5D=admin')
  })

  test('deepObject style recurses into nested objects', () => {
    expect(serializeStyledQuery({ a: { b: { c: 1 } } }, { a: { style: 'deepObject' } })).toBe('a%5Bb%5D%5Bc%5D=1')
  })

  test('deepObject style indexes an array of objects', () => {
    expect(serializeStyledQuery({ items: [{ price: 'p_1', quantity: 1 }] }, { items: { style: 'deepObject' } })).toBe(
      'items%5B0%5D%5Bprice%5D=p_1&items%5B0%5D%5Bquantity%5D=1',
    )
    expect(serializeStyledQuery({ expand: ['a', 'b'] }, { expand: { style: 'deepObject' } })).toBe('expand=a&expand=b')
  })

  test('encodes a space as %20 with or without a style', () => {
    expect(serializeStyledQuery({ q: 'a b', styled: 'a b', plus: 'a+b' }, { styled: { style: 'form' } })).toBe('q=a%20b&styled=a%20b&plus=a%2Bb')
  })

  test('serializes Date values as ISO-8601', () => {
    expect(serializeStyledQuery({ since: new Date('2020-01-02T03:04:05.000Z') })).toBe('since=2020-01-02T03%3A04%3A05.000Z')
  })

  test('allowReserved leaves reserved characters unencoded', () => {
    expect(serializeStyledQuery({ path: '/a/b' }, { path: { allowReserved: true } })).toBe('path=/a/b')
    expect(serializeStyledQuery({ path: '/a/b' })).toBe('path=%2Fa%2Fb')
  })

  test('allowReserved still encodes characters that end the query or change a form value', () => {
    expect(serializeStyledQuery({ r: 'a/b?c#d', q: 'x' }, { r: { allowReserved: true } })).toBe('r=a/b?c%23d&q=x')
    expect(serializeStyledQuery({ r: 'a&b=c+d' }, { r: { allowReserved: true } })).toBe('r=a%26b=c%2Bd')
    expect(serializeStyledQuery({ r: ['a#', 'b&'] }, { r: { allowReserved: true, explode: false } })).toBe('r=a%23,b%26')
  })
})

describe('serializePath and serializeStyledPath', () => {
  test('simple style URL-encodes a primitive value', () => {
    expect(serializePath({ name: 'id', value: 'a b' })).toBe('a%20b')
  })

  test('simple style joins array members with commas', () => {
    expect(serializePath({ name: 'ids', value: [3, 4, 5] })).toBe('3,4,5')
  })

  test('simple style flattens objects to comma-separated key,value pairs', () => {
    expect(serializePath({ name: 'point', value: { x: 1, y: 2 } })).toBe('x,1,y,2')
  })

  test('simple style with explode renders objects as key=value pairs', () => {
    expect(serializePath({ name: 'point', value: { x: 1, y: 2 }, options: { explode: true } })).toBe('x=1,y=2')
  })

  test('label style prefixes a dot', () => {
    expect(serializeStyledPath({ name: 'id', value: 5, options: { style: 'label' } })).toBe('.5')
    expect(serializeStyledPath({ name: 'ids', value: [3, 4], options: { style: 'label' } })).toBe('.3,4')
    expect(serializeStyledPath({ name: 'ids', value: [3, 4], options: { style: 'label', explode: true } })).toBe('.3.4')
    expect(serializeStyledPath({ name: 'point', value: { x: 1, y: 2 }, options: { style: 'label', explode: true } })).toBe('.x=1.y=2')
  })

  test('matrix style prefixes a named segment', () => {
    expect(serializeStyledPath({ name: 'id', value: 5, options: { style: 'matrix' } })).toBe(';id=5')
    expect(serializeStyledPath({ name: 'id', value: [3, 4], options: { style: 'matrix' } })).toBe(';id=3,4')
    expect(serializeStyledPath({ name: 'id', value: [3, 4], options: { style: 'matrix', explode: true } })).toBe(';id=3;id=4')
    expect(serializeStyledPath({ name: 'point', value: { x: 1, y: 2 }, options: { style: 'matrix', explode: true } })).toBe(';x=1;y=2')
  })

  test('throws on a styled query parameter, which needs the registered query serializer', () => {
    expect(() => serializeQuery({ ids: [1, 2] }, { ids: { explode: false } })).toThrow('register serializer.query')
    expect(serializeQuery({ ids: [1, 2], filter: { a: 'x y' }, skip: undefined })).toBe('ids=1&ids=2&a=x%20y')
  })

  test('throws on a label or matrix parameter, which needs the registered path serializer', () => {
    expect(() => serializePath({ name: 'id', value: 5, options: { style: 'label' } })).toThrow('register serializer.path')
    expect(serializeStyledPath({ name: 'ids', value: [3, 4] })).toBe('3,4')
  })

  test('serializes undefined and null to an empty string', () => {
    expect(serializePath({ name: 'id', value: undefined })).toBe('')
    expect(serializePath({ name: 'id', value: null })).toBe('')
  })

  test('serializes a Date value as ISO-8601', () => {
    expect(serializePath({ name: 'since', value: new Date('2020-01-02T03:04:05.000Z') })).toBe('2020-01-02T03%3A04%3A05.000Z')
  })
})

describe('built-in media types encode', () => {
  test.each(['application/json', 'application/json; charset=utf-8', 'application/vnd.api+json'])('JSON-encodes strings for %s', (contentType) => {
    expect(encodeBody({ body: 'a"b\nc', contentType })).toBe('"a\\"b\\nc"')
    expect(encodeBody({ body: '', contentType })).toBe('""')
  })

  test.each([undefined, 'text/plain', 'application/jsonl'])('passes strings through for %s', (contentType) => {
    expect(encodeBody({ body: 'abc', contentType })).toBe('abc')
  })

  test('JSON-encodes a urlencoded property with a JSON contentType', () => {
    const encoding = { meta: { contentType: 'application/json' } }
    expect(encodeBody({ body: { meta: { a: 1 } }, contentType: 'application/x-www-form-urlencoded', encoding })).toBe('meta=%7B%22a%22%3A1%7D')
  })

  test('ignores a urlencoded contentType when the property sets a style', () => {
    const encoding = { meta: { contentType: 'application/json', explode: true } }
    expect(encodeBody({ body: { meta: { a: 1 } }, contentType: 'application/x-www-form-urlencoded', encoding })).toBe('a=1')
  })

  test('JSON-serializes plain objects', () => {
    expect(encodeBody({ body: { name: 'odie' } })).toBe('{"name":"odie"}')
  })

  test.each(['application/xml', 'text/xml; charset=utf-8', 'application/atom+xml', 'application/yaml', 'application/x-yaml', 'text/csv'])(
    'refuses to send an object as JSON under %s, and passes a string through',
    (contentType) => {
      expect(() => encodeBody({ body: { name: 'odie' }, contentType })).toThrow(TypeError)
      expect(() => encodeBody({ body: ['odie'], contentType })).toThrow(/mediaTypes\['[a-z+/-]+'\]\.encode/)
      expect(encodeBody({ body: '<pet/>', contentType })).toBe('<pet/>')
    },
  )

  test('JSON-encodes an object for a vendor type without a +json suffix', () => {
    expect(encodeBody({ body: { name: 'odie' }, contentType: 'application/vnd.acme.v1' })).toBe('{"name":"odie"}')
  })

  test('passes FormData through untouched', () => {
    const formData = new FormData()
    expect(encodeBody({ body: formData })).toBe(formData)
  })

  test.each([
    'application/x-www-form-urlencoded',
    'Application/X-WWW-Form-Urlencoded',
    'APPLICATION/X-WWW-FORM-URLENCODED',
    'Application/X-WWW-Form-Urlencoded; charset=UTF-8',
  ])('encodes objects as URLSearchParams for %s', (contentType) => {
    const body = encodeBody({ body: { a: '1' }, contentType })
    expect(body).toBeInstanceOf(URLSearchParams)
    expect(body?.toString()).toBe('a=1')
  })

  test.each(['multipart/form-data', 'Multipart/Form-Data', 'MULTIPART/FORM-DATA', 'Multipart/Form-Data; boundary=example'])(
    'builds FormData from a plain object for %s',
    (contentType) => {
      const body = encodeBody({ body: { field: 'x' }, contentType })
      expect(body).toBeInstanceOf(FormData)
      expect((body as FormData).get('field')).toBe('x')
    },
  )

  test('passes Blob members through and serializes dates, objects, and arrays in multipart', () => {
    const file = new Blob(['hi'], { type: 'text/plain' })
    const body = encodeBody({
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
    expect(encodeBody({ body: formData, contentType: 'multipart/form-data' })).toBe(formData)
  })

  test('honors per-property encoding for urlencoded bodies', () => {
    const body = encodeBody({
      body: { tags: ['a', 'b'], filter: { x: 1 } },
      contentType: 'application/x-www-form-urlencoded',
      encoding: { tags: { style: 'form', explode: false }, filter: { style: 'deepObject' } },
    })
    expect(body).toBe('tags=a,b&filter%5Bx%5D=1')
  })

  test('sends a multipart array with explode false as one joined part', () => {
    const body = encodeBody({
      body: { labels: ['a', 'b'], pipes: ['x', 'y'], tags: ['c', 'd'] },
      contentType: 'multipart/form-data',
      encoding: { labels: { style: 'form', explode: false }, pipes: { style: 'pipeDelimited', explode: false } },
    }) as FormData
    expect(body.getAll('labels')).toStrictEqual(['a,b'])
    expect(body.getAll('pipes')).toStrictEqual(['x|y'])
    expect(body.getAll('tags')).toStrictEqual(['c', 'd'])
  })

  test('keeps one JSON part per object in a multipart array with explode false', () => {
    const body = encodeBody({
      body: { items: [{ a: 1 }, { a: 2 }] },
      contentType: 'multipart/form-data',
      encoding: { items: { style: 'form', explode: false } },
    }) as FormData
    expect(body.getAll('items')).toStrictEqual(['{"a":1}', '{"a":2}'])
  })

  test('emits a bigint as a JSON number', () => {
    expect(encodeBody({ body: { id: 42n } })).toBe('{"id":42}')
  })

  test('emits a bigint nested in a multipart part', () => {
    const body = encodeBody({ body: { meta: { id: 42n } }, contentType: 'multipart/form-data' }) as FormData
    expect(body.get('meta')).toBe('{"id":42}')
  })

  test('throws on a bigint outside the safe-integer range', () => {
    expect(() => encodeBody({ body: { id: 9007199254740993n } })).toThrow(/without losing precision/)
    expect(() => encodeBody({ body: { id: -9007199254740993n } })).toThrow(/without losing precision/)
  })

  test('applies a per-part content type from multipart encoding via a typed Blob', async () => {
    const body = encodeBody({
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

describe('serializeHeaders', () => {
  test('sends a header with a JSON content type as its JSON string', () => {
    const result = serializeHeaders(
      { 'X-Meta': { a: 1 }, 'X-Name': 'odie' },
      { 'X-Meta': { contentType: 'application/json' }, 'X-Name': { contentType: 'application/json' } },
    )
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-Meta': '{"a":1}', 'X-Name': '"odie"' })
  })

  test('escapes non-ASCII characters in a JSON header so it stays a valid header value', () => {
    const result = serializeHeaders({ 'X-Meta': { name: '日本' } }, { 'X-Meta': { contentType: 'application/json' } }) as Array<[string, string]>
    expect(result[0]?.[1]).toBe('{"name":"\\u65e5\\u672c"}')
    expect(JSON.parse(result[0]?.[1] ?? '')).toStrictEqual({ name: '日本' })
  })

  test('serializes array and object headers with the simple style', () => {
    const result = serializeHeaders({ 'X-Ids': [3, 4], 'X-Filter': { role: 'admin' } }, { 'X-Ids': { explode: false }, 'X-Filter': { explode: true } })
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-Ids': '3,4', 'X-Filter': 'role=admin' })
  })

  test('serializes a Date header value as ISO-8601', () => {
    const result = serializeHeaders({ 'X-Since': new Date('2020-01-02T03:04:05.000Z') }, { 'X-Since': {} })
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-Since': '2020-01-02T03:04:05.000Z' })
  })

  test('passes primitives through and uses the simple style for headers without metadata', () => {
    const result = serializeHeaders({ Authorization: 'Bearer x', 'X-Raw': [1, 2] }, { Authorization: { explode: true } })
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ Authorization: 'Bearer x', 'X-Raw': '1,2' })
  })

  test('uses the simple style when the operation has no header styles', () => {
    const result = serializeHeaders({ 'X-List': ['a', 'b'], 'X-Obj': { k: 'v' } }, undefined)
    expect(Object.fromEntries(result as Array<[string, unknown]>)).toStrictEqual({ 'X-List': 'a,b', 'X-Obj': 'k,v' })
  })
})

describe('createClientCore', () => {
  test('sends a null body as the JSON document null, and leaves an undefined body out', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await client({ method: 'PATCH', url: '/pet/1', body: null, contentType: 'application/merge-patch+json' })
    await client({ method: 'PATCH', url: '/pet/1', body: undefined })
    expect(calls.map((call) => [call.body, call.headers['Content-Type']])).toStrictEqual([
      ['null', 'application/merge-patch+json'],
      [undefined, undefined],
    ])
  })

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
    expect(calls[0]?.url).toBe('/pets?id=3%7C4&filter%5Ba%5D=1')
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

  test('encodes the body with a media type the client registers, merged per key over the built-ins', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({
      defaultTransport: transport,
      mediaTypes: { 'application/json': { encode: (body) => `custom:${JSON.stringify(body)}` } },
    })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' } })
    expect(calls[0]?.body).toBe('custom:{"name":"odie"}')
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
    await client({ method: 'POST', url: '/pet', body: 'a', contentType: 'text/plain' })
    expect(calls[1]?.body).toBe('a')
  })

  test('throws on cookie params without a cookie serializer, and keeps it when another serializer is set', async () => {
    const { transport } = fakeTransport()
    const bare = createCore<string, string>({ defaultTransport: transport })
    await expect(bare({ method: 'GET', url: '/pet', cookies: { session: 'abc' } })).rejects.toThrow('register serializer.cookie')
    await bare({ method: 'GET', url: '/pet', cookies: { session: undefined, theme: null } })

    const { client, calls } = createClient()
    client.setConfig({ serializer: { query: () => 'q=1' } })
    await client({ method: 'GET', url: '/pet', cookies: { session: 'abc' } })
    expect(calls[0]?.url).toBe('/pet?q=1')
    expect(calls[0]?.headers['Cookie']).toBe('session=abc')
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

  test('sends a Date header as ISO text when the spec registers no header serializer', async () => {
    const { transport, calls } = fakeTransport()
    const client = createCore<string, string>({ defaultTransport: transport, serializer: { ...serializers, header: undefined } })
    await client({ method: 'GET', url: '/pet', headers: { 'If-Modified-Since': new Date(0) } as never })
    expect(calls[0]?.headers['If-Modified-Since']).toBe('1970-01-01T00:00:00.000Z')
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

  test('removes every content-type spelling when a media type encodes FormData', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, headers: { 'cOnTeNt-TyPe': 'application/xml' } })
    const formData = new FormData()
    formData.append('field', 'x')
    await client({
      method: 'POST',
      url: '/pet',
      body: { field: 'x' },
      contentType: 'application/json',
      mediaTypes: { 'application/json': { encode: () => formData } },
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
    const result = await client({ method: 'GET', url: '/pet/1' })
    expect(result).toStrictEqual({
      status: 200,
      data: { id: 1 },
      error: undefined,
      contentType: 'application/json',
      headers: expect.any(Headers),
      request: 'REQ',
      response: 'RES',
    })
    expect(result.headers.get('content-type')).toBe('application/json')
  })

  test('throws a ResponseError for a non-2xx status by default', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405, statusText: 'Method Not Allowed' })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 405, data: { message: 'invalid' } })
  })

  test('a ResponseError carries the response headers', async () => {
    const { client } = createClient({ data: { message: 'slow down' }, status: 429, statusText: 'Too Many Requests' })
    const error = await client({ method: 'GET', url: '/pet' }).catch((thrown: unknown) => thrown)
    expect(ResponseError.is(error) && error.headers.get('content-type')).toBe('application/json')
    expect(new ResponseError({ data: undefined, status: 500, statusText: '', request: 'REQ', response: 'RES' }).headers.get('x')).toBeNull()
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
    const result = await client({ method: 'GET', url: '/pet', transport: override.transport })
    expect(override.calls).toHaveLength(1)
    expect(result.data).toStrictEqual({ from: 'override' })
  })

  test('runs the request parser before the send and the response parser on success', async () => {
    const { client, calls } = createClient({ data: { raw: true }, status: 200 })
    const request = vi.fn((body: unknown) => ({ ...(body as object), validated: true }))
    const response = vi.fn(() => ({ parsed: true }))
    const result = await client({
      method: 'POST',
      url: '/pet',
      body: { name: 'odie' },
      validator: { request: toSchema(request), response: toSchema(response) },
    })
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
    const result = await client({ method: 'POST', url: '/pet', throwOnError: false, validator: { error: toSchema(error) } })
    expect(error).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual({
      status: 405,
      data: undefined,
      error: { parsed: true },
      contentType: 'application/json',
      headers: expect.any(Headers),
      request: 'REQ',
      response: 'RES',
    })
  })

  test('picks the error validator by status, then range, then default, and skips undeclared statuses', async () => {
    // Accepts only a body whose `code` matches, and tags it with the schema that ran.
    const toCodeSchema = (code: string) => ({
      '~standard': {
        validate: (value: unknown) =>
          (value as { code?: string }).code === code ? { value: { code, checkedBy: code } } : { issues: [{ message: `not ${code}`, path: ['code'] }] },
      },
    })
    const call = (status: number, data: unknown, error: Record<string, ReturnType<typeof toCodeSchema>>) =>
      createClient({ data, status }).client({ method: 'GET', url: '/pet/1', throwOnError: false, validator: { error } })
    const byStatus = { 404: toCodeSchema('not-found'), '5xx': toCodeSchema('upstream') }

    expect(await call(404, { code: 'not-found' }, byStatus)).toMatchObject({ status: 404, error: { checkedBy: 'not-found' } })
    await expect(call(404, { code: 'upstream' }, byStatus)).rejects.toMatchObject({ name: 'ParseError' })
    expect(await call(503, { code: 'upstream' }, byStatus)).toMatchObject({ status: 503, error: { checkedBy: 'upstream' } })
    expect(await call(422, '<html>Unprocessable</html>', byStatus)).toMatchObject({ status: 422, error: '<html>Unprocessable</html>' })

    expect(await call(503, { code: 'upstream' }, { '5XX': toCodeSchema('upstream') })).toMatchObject({ status: 503, error: { checkedBy: 'upstream' } })

    const withDefault = { 404: toCodeSchema('not-found'), default: toCodeSchema('other') }
    expect(await call(502, { code: 'other' }, withDefault)).toMatchObject({ status: 502, error: { checkedBy: 'other' } })
    await expect(call(502, '<html>Bad Gateway</html>', withDefault)).rejects.toMatchObject({ name: 'ParseError' })
  })

  test('validates the error body of a call that throws, so the ResponseError carries the parsed body', async () => {
    const { client } = createClient({ data: '<html>Bad Gateway</html>', status: 502 })
    const error = vi.fn(() => ({ parsed: true }))
    await expect(client({ method: 'GET', url: '/pet/1', validator: { error: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { error: toSchema(error) } })).rejects.toMatchObject({
      name: 'ResponseError',
      status: 502,
      data: { parsed: true },
    })
    expect(error).toHaveBeenCalledTimes(1)
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
    const result = await client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })
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
    const result = await client({
      method: 'POST',
      url: '/pet',
      body: { name: 1 },
      query: { limit: 1 },
      validator: { request: toFailingSchema(), query: toFailingSchema(), response: toFailingSchema() },
    })
    expect(result.data).toStrictEqual({ id: 1 })
  })

  test('skips only the directions the client turns off', async () => {
    const { transport } = fakeTransport({ data: { id: 1 }, status: 200 })
    const client = createClientCore<string, string>({ defaultTransport: transport, validate: { response: false } })
    const result = await client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })
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
    const result = await client({
      method: 'GET',
      url: '/pet/1',
      validator: { response: toFailingSchema() },
      onValidationError: perCall,
    })
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

  test('hands each error handler the error the one before returned', async () => {
    class NotFound extends Error {}
    const { client } = createClient({ status: 404 })
    const seen: Array<string> = []
    client.interceptors.error.use((error) => void seen.push(error.name))
    client.interceptors.error.use((error) => (ResponseError.is(error) && error.status === 404 ? new NotFound() : error))
    client.interceptors.error.use((error) => void seen.push(error.constructor.name))
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBeInstanceOf(NotFound)
    expect(seen).toStrictEqual(['ResponseError', 'NotFound'])
  })

  test('runs the error interceptor for a network error, an abort, and a failed validation', async () => {
    const network = new TypeError('fetch failed')
    const client = createClientCore<string, string>({
      defaultTransport: async () => {
        throw network
      },
    })
    const seen: Array<unknown> = []
    client.interceptors.error.use((error) => void seen.push(error))
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBe(network)

    const controller = new AbortController()
    controller.abort(new DOMException('stop', 'AbortError'))
    await expect(client({ method: 'GET', url: '/pet', signal: controller.signal })).rejects.toBe(controller.signal.reason)

    const { client: validating } = createClient({ data: { id: 1 } })
    validating.interceptors.error.use((error) => void seen.push(error.name))
    await expect(validating({ method: 'GET', url: '/pet', validator: { response: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
    expect(seen).toStrictEqual([network, controller.signal.reason, 'ParseError'])
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

  test('createClient produces an instance with isolated interceptors', async () => {
    const { client, calls } = createClient()
    client.interceptors.request.use((request) => ({ ...request, headers: { ...request.headers, 'X-Parent': '1' } }))
    const child = client.createClient()
    child.interceptors.request.use((request) => request)
    expect(child).not.toBe(client)
    await child({ method: 'GET', url: '/pet' })
    expect(calls[0]?.headers['X-Parent']).toBeUndefined()
  })

  test('extend keeps the config and runs the parent interceptors before its own, including ones added later', async () => {
    const { client, calls } = createClient()
    client.setConfig({ baseURL: 'https://api.test', headers: { 'X-Client': 'parent' } })
    const order: Array<string> = []
    client.interceptors.request.use(() => void order.push('parent'))
    const child = client.extend({ headers: { 'X-Child': '1' } })
    child.interceptors.request.use(() => void order.push('child'))
    client.interceptors.response.use(() => void order.push('parent response'))

    await child({ method: 'GET', url: '/pet' })
    expect(calls[0]).toMatchObject({ url: 'https://api.test/pet', headers: { 'X-Client': 'parent', 'X-Child': '1' } })
    expect(order).toStrictEqual(['parent', 'child', 'parent response'])

    // The parent does not run the child's interceptors.
    order.length = 0
    await client({ method: 'GET', url: '/pet' })
    expect(order).toStrictEqual(['parent', 'parent response'])
  })
})

describe('media types', () => {
  const answer =
    (body: BodyInit | null, headers: Record<string, string> = {}, status = 200): Transport<string, string> =>
    async () =>
      new Response(body, { status, headers })
  const call = (
    transport: Transport<string, string>,
    config: Omit<RequestConfig<unknown, string, string>, 'method' | 'url'> & { method?: 'GET' | 'HEAD' } = {},
  ) => createClientCore<string, string>({ defaultTransport: transport, throwOnError: false })({ method: 'GET', url: '/pet', ...config })

  test('matches the exact type, then the structured suffix, then the type wildcard, then the catch-all', () => {
    const mediaTypes: MediaTypes = { 'application/xml': {}, 'application/*+xml': {}, 'text/*': {}, '*/*': {} }
    const pick = (contentType: string | undefined) => resolveMediaType({ mediaTypes, contentType })
    expect(pick('Application/XML; charset=utf-8')).toBe(mediaTypes['application/xml'])
    expect(pick('application/atom+xml')).toBe(mediaTypes['application/*+xml'])
    expect(pick(' text/csv ')).toBe(mediaTypes['text/*'])
    expect(pick('video/mp4')).toBe(mediaTypes['*/*'])
    expect(pick(undefined)).toBe(mediaTypes['*/*'])
  })

  test('skips a handler without the method asked for', () => {
    const xml = { decode: async () => 'xml' }
    const mediaTypes: MediaTypes = { ...defaultMediaTypes, 'application/xml': xml }
    expect(resolveMediaType({ mediaTypes, contentType: 'application/xml', use: 'decode' })).toBe(xml)
    expect(resolveMediaType({ mediaTypes, contentType: 'application/xml', use: 'encode' })).toBe(defaultMediaTypes['*/*'])
  })

  test.each(['application/json', 'application/problem+json', 'text/json', 'application/vnd.api+json; charset=utf-8'])(
    'decodes a %s body as JSON',
    async (contentType) => {
      expect((await call(answer('{"ok":true}', { 'content-type': contentType }))).data).toStrictEqual({ ok: true })
    },
  )

  test('throws a ParseError for invalid JSON under a JSON media type, and keeps a non-JSON body as text under */*', async () => {
    await expect(call(answer('Pet deleted', { 'content-type': 'application/json' }))).rejects.toMatchObject({
      name: 'ParseError',
      message: 'Invalid JSON in a application/json body',
    })
    expect((await call(answer('Pet deleted', { 'content-type': 'application/x-unknown' }))).data).toBe('Pet deleted')
    expect((await call(answer('{"a":1}', { 'content-type': 'application/x-unknown' }))).data).toStrictEqual({ a: 1 })
  })

  test('decodes text and binary types, and a form body', async () => {
    expect((await call(answer('<pet/>', { 'content-type': 'application/xml' }))).data).toBe('<pet/>')
    expect((await call(answer('hi', { 'content-type': 'text/plain' }))).data).toBe('hi')
    const blob = (await call(answer('bytes', { 'content-type': 'image/png' }))).data
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).type).toBe('image/png')
    const form = await call(answer('a=1', { 'content-type': 'application/x-www-form-urlencoded' }), { mediaTypes: formMediaTypes })
    expect((form.data as FormData).get('a')).toBe('1')
  })

  test('types and returns a JSON Lines variant next to JSON as the raw stream', async () => {
    type Responses = { '200': { contentType: 'application/json'; data: { id: number } } | { contentType: 'application/jsonl'; data: { id: number } } }
    const client = createClientCore<string, string>({
      defaultTransport: answer('{"id":1}\n', { 'content-type': 'application/jsonl' }),
      mediaTypes: streamMediaTypes,
    })
    const result = await client<Responses>({ method: 'GET', url: '/updates' })

    expect(result.contentType).toBe('application/jsonl')
    if (result.contentType === 'application/jsonl') {
      const stream: ReadableStream<Uint8Array> = result.data
      expect(stream).toBeInstanceOf(ReadableStream)
    }
  })

  test('gives no data for 204, 205, 304, a HEAD request, and an empty body', async () => {
    for (const status of [204, 205, 304]) expect((await call(answer(null, { 'content-type': 'application/json' }, status))).data).toBeUndefined()
    expect((await call(answer('{"a":1}', { 'content-type': 'application/json' }), { method: 'HEAD' })).data).toBeUndefined()
    expect((await call(answer('', { 'content-type': 'application/json' }))).data).toBeUndefined()
    expect((await call(answer(null))).data).toBeUndefined()
  })

  test('decodes a 2xx answer without a Content-Type as the media type the call asked for, then as */*', async () => {
    // A `Response` with a string body labels it `text/plain` itself, so these bodies are bytes.
    const bytes = (text: string) => new TextEncoder().encode(text)
    expect((await call(answer(bytes('{"a":1}')))).data).toStrictEqual({ a: 1 })
    expect((await call(answer(bytes('plain')))).data).toBe('plain')
    expect((await call(answer(bytes('a')), { contentType: { response: 'image/png' } })).data).toBeInstanceOf(Blob)
    expect((await call(answer(bytes('data: 1\n\n')), { contentType: { response: 'text/event-stream' }, mediaTypes: streamMediaTypes })).data).toBeInstanceOf(
      ReadableStream,
    )
    // An error answer without a Content-Type is not read as the success type.
    expect((await call(answer(bytes('{"code":1}'), {}, 500), { contentType: { response: 'image/png' } })).error).toStrictEqual({ code: 1 })
  })

  test('reads a 2xx body as parseAs says, and still decodes an error body by its media type', async () => {
    const json = () => answer('{"a":1}', { 'content-type': 'application/json' })
    expect((await call(json(), { parseAs: 'text' })).data).toBe('{"a":1}')
    expect((await call(json(), { parseAs: 'blob' })).data).toBeInstanceOf(Blob)
    expect((await call(json(), { parseAs: 'arrayBuffer' })).data).toBeInstanceOf(ArrayBuffer)
    expect((await call(json(), { parseAs: 'stream' })).data).toBeInstanceOf(ReadableStream)
    expect((await call(answer('{"a":1}', { 'content-type': 'text/plain' }), { parseAs: 'json' })).data).toStrictEqual({ a: 1 })
    expect((await call(answer('{"message":"gone"}', { 'content-type': 'application/json' }, 404), { parseAs: 'blob' })).error).toStrictEqual({
      message: 'gone',
    })
  })

  test('reads a parseAs json body with the registered application/json handler', async () => {
    const lenient: MediaTypes = { 'application/json': { decode: async (response) => ({ lenient: await response.text() }) } }
    const result = await call(answer('not json', { 'content-type': 'text/plain' }), { parseAs: 'json', mediaTypes: lenient })
    expect(result.data).toStrictEqual({ lenient: 'not json' })
  })

  test('marks the request as streamed for parseAs stream and for an Accept a stream media type reads', async () => {
    const { client, calls } = createClient()
    client.setConfig({ mediaTypes: streamMediaTypes })
    await client({ method: 'GET', url: '/a' })
    await client({ method: 'GET', url: '/b', parseAs: 'stream' })
    await client({ method: 'GET', url: '/c', contentType: { response: 'text/event-stream' } })
    expect(calls.map((request) => request.stream)).toStrictEqual([false, true, true])
  })

  test('merges a per-call media type over the client-level one', async () => {
    const transport = answer('<pet/>', { 'content-type': 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport, mediaTypes: { 'application/xml': { decode: async () => 'client' } } })
    expect((await client({ method: 'GET', url: '/pet' })).data).toBe('client')
    const perCall = await client({
      method: 'GET',
      url: '/pet',
      mediaTypes: { 'application/xml': { decode: async (response) => `call:${await response.text()}` } },
    })
    expect(perCall.data).toBe('call:<pet/>')
  })

  test('hands decode the full Content-Type and the status', async () => {
    const decode = vi.fn(async (_response: Response, _context: MediaTypeContext) => 'decoded')
    await call(answer('x', { 'content-type': 'application/xml; charset=utf-8' }, 201), { mediaTypes: { 'application/xml': { decode } } })
    expect(decode.mock.calls[0]?.[1]).toMatchObject({ contentType: 'application/xml; charset=utf-8', status: 201 })
  })

  test('keeps a stream body a raw stream on a regular call, without validating it', async () => {
    const response = vi.fn(() => 'validated')
    const result = await call(answer('{"a":1}\n', { 'content-type': 'application/x-ndjson' }), {
      mediaTypes: streamMediaTypes,
      validator: { response: toSchema(response) },
    })
    expect(result.data).toBeInstanceOf(ReadableStream)
    expect(response).not.toHaveBeenCalled()
  })

  test('decodes a text error body of a stream media type whole', async () => {
    const client = createClientCore<string, string>({
      defaultTransport: answer('busy', { 'content-type': 'text/event-stream' }, 503),
      mediaTypes: streamMediaTypes,
    })
    await expect(client.stream({ method: 'GET', url: '/events' })).rejects.toMatchObject({ name: 'ResponseError', status: 503, data: 'busy' })
  })
})

describe('client.stream', () => {
  const sse =
    (body: string, status = 200): Transport<string, string> =>
    async () =>
      new Response(body, { status, headers: { 'content-type': 'text/event-stream' } })
  const streamClient = (transport: Transport<string, string>) => createClientCore<string, string>({ defaultTransport: transport, mediaTypes: streamMediaTypes })
  async function collect(items: AsyncIterable<unknown>) {
    const values: Array<unknown> = []
    for await (const item of items) values.push(item)
    return values
  }

  test('reads Server-Sent Events, validates each payload with eventShape data, and keeps the last event ID', async () => {
    const response = vi.fn((value: unknown) => ({ checked: value }))
    const stream = await streamClient(sse('id: 1\ndata: {"a":1}\n\nid: 2\ndata: {"a":2}\n\n')).stream({
      method: 'GET',
      url: '/events',
      eventShape: 'data',
      validator: { response: toSchema(response) },
    })
    expect(await collect(stream)).toStrictEqual([
      { data: { checked: { a: 1 } }, event: 'message', id: '1' },
      { data: { checked: { a: 2 } }, event: 'message', id: '2' },
    ])
    expect(stream.lastEventId).toBe('2')
    expect(stream.data).toBe(stream.stream)
  })

  test('validates the whole event with eventShape event, after transform', async () => {
    const stream = await streamClient(sse('event: ping\ndata: 1\n\n')).stream({
      method: 'GET',
      url: '/events',
      eventShape: 'event',
      transform: (event) => ({ ...event, event: event.event.toUpperCase() }),
      validator: { response: toSchema((value) => ({ ...(value as object), seen: true })) },
    })
    expect(await collect(stream)).toStrictEqual([{ data: 1, event: 'PING', seen: true }])
  })

  test('stops at the terminator and applies maxEventSize', async () => {
    const stream = await streamClient(sse('data: 1\n\ndata: [DONE]\n\ndata: 2\n\n')).stream({ method: 'GET', url: '/events', terminator: '[DONE]' })
    expect(await collect(stream)).toStrictEqual([{ data: 1, event: 'message' }])
    const large = await streamClient(sse('data: 123456\n\n')).stream({ method: 'GET', url: '/events', maxEventSize: 4 })
    await expect(collect(large)).rejects.toBeInstanceOf(RangeError)
  })

  test('reads JSON Lines and validates each line whole', async () => {
    const transport = async () => new Response('{"a":1}\n{"a":2}\n', { headers: { 'content-type': 'application/jsonl' } })
    const stream = await streamClient(transport).stream({ method: 'GET', url: '/logs', validator: { response: toSchema((value) => ({ line: value })) } })
    expect(await collect(stream)).toStrictEqual([{ line: { a: 1 } }, { line: { a: 2 } }])
  })

  test('throws a TypeError with the body as cause for a 2xx answer whose media type cannot stream, and streams nothing for an empty one', async () => {
    const json = async () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })
    await expect(streamClient(json).stream({ method: 'GET', url: '/events' })).rejects.toMatchObject({
      name: 'TypeError',
      message: 'Expected a streamed body, got application/json',
      cause: { ok: true },
    })
    const empty = await streamClient(async () => new Response(null, { status: 204 })).stream({ method: 'GET', url: '/events' })
    expect(await collect(empty)).toStrictEqual([])
  })

  test('asks for an event stream unless the call sets Accept', async () => {
    const accepts: Array<string | undefined> = []
    const transport = async (request: ResolvedRequest) => (
      accepts.push(request.headers['Accept'] ?? request.headers['accept']),
      new Response(null, { status: 204 })
    )
    await streamClient(transport).stream({ method: 'GET', url: '/events' })
    await streamClient(transport).stream({ method: 'GET', url: '/events', headers: { accept: 'application/jsonl' } })
    expect(accepts).toStrictEqual(['text/event-stream', 'application/jsonl'])
  })

  test('cancels a raw body it cannot stream before it throws', async () => {
    let canceled = false
    const body = new ReadableStream({ cancel: () => void (canceled = true) })
    const transport = async () => new Response(body, { headers: { 'content-type': 'application/json' } })
    await expect(streamClient(transport).stream({ method: 'GET', url: '/events', parseAs: 'stream' })).rejects.toBeInstanceOf(TypeError)
    expect(canceled).toBe(true)
  })

  test('returns the error of a failed call made with throwOnError false and streams nothing', async () => {
    const failed = async () => new Response('{"code":"busy"}', { status: 503, headers: { 'content-type': 'application/json' } })
    const result = await streamClient(failed).stream({ method: 'GET', url: '/events', throwOnError: false })
    expect(result).toMatchObject({ status: 503, error: { code: 'busy' }, data: undefined })
    expect(await collect(result)).toStrictEqual([])
  })

  test('ends the loop with the abort reason once the signal is aborted, and cancels the reader on break', async () => {
    const controller = new AbortController()
    const stream = await streamClient(sse('data: 1\n\ndata: 2\n\n')).stream({ method: 'GET', url: '/events', signal: controller.signal })
    const seen: Array<unknown> = []
    const reason = new Error('stop')
    await expect(
      (async () => {
        for await (const event of stream) {
          seen.push(event)
          controller.abort(reason)
        }
      })(),
    ).rejects.toBe(reason)
    expect(seen).toHaveLength(1)

    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start: (source) => source.enqueue(new TextEncoder().encode('data: 1\n\ndata: 2\n\n')),
      cancel,
    })
    const broken = await streamClient(async () => new Response(body, { headers: { 'content-type': 'text/event-stream' } })).stream({
      method: 'GET',
      url: '/events',
    })
    for await (const _event of broken) break
    expect(cancel).toHaveBeenCalled()
  })

  test('passes the stream through response interceptors as the raw body', async () => {
    const client = streamClient(sse('data: 1\n\n'))
    const seen: Array<unknown> = []
    client.interceptors.response.use((response) => void seen.push(response.data))
    const stream = await client.stream({ method: 'GET', url: '/events' })
    expect(seen[0]).toBeInstanceOf(ReadableStream)
    expect(await collect(stream)).toHaveLength(1)
  })
})

describe('isResponseError', () => {
  type Responses = { '200': { id: number }; '404': { message: string }; '4xx': { code: string }; default: { fault: true } }

  test('narrows data by status, a range key, and default', async () => {
    const { client } = createClient({ data: { message: 'gone' }, status: 404 })
    const error = await client({ method: 'GET', url: '/pet' }).catch((caught: unknown) => caught)
    expect(isResponseError<Responses>(error)).toBe(true)
    if (!isResponseError<Responses>(error)) return
    if (error.status === 404) {
      const message: string = error.data.message
      expect(message).toBe('gone')
    }
    if (error.status === 418) {
      const code: string = error.data.code
      expect(code).toBeUndefined()
    }
    expect(isResponseError<Responses>(new Error('network'))).toBe(false)
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
  const transportWith = (result: FakeResult) => fakeTransport(result)

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
    const { transport } = transportWith({ data: { id: 1 }, contentType: 'application/json; charset=utf-8' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    const result = await client({ method: 'GET', url: '/pet/1' })
    expect(result.contentType).toBe('application/json')
    expect(result.data).toStrictEqual({ id: 1 })
  })

  test.each([200, 422])('validates a decoded undefined value for status %s', async (status) => {
    const { transport } = transportWith({ data: 'raw', status, contentType: 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    const response = vi.fn(() => 'success')
    const error = vi.fn(() => 'failure')
    const result = await client({
      url: '/pet',
      throwOnError: false,
      mediaTypes: { 'application/xml': { decode: async () => undefined } },
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

  test.each([false, true])('keeps the selected validation recovery when a media type changes config (per-call: %s)', async (perCall) => {
    const { transport } = transportWith({ contentType: 'application/xml' })
    const initial = vi.fn(() => ({ value: 'initial' }))
    const override = vi.fn(() => ({ value: 'override' }))
    const replacement = vi.fn(() => ({ value: 'replacement' }))
    const client = createClientCore<string, string>({ defaultTransport: transport, onValidationError: initial })
    const result = await client({
      url: '/pet',
      onValidationError: perCall ? override : undefined,
      validator: { response: toFailingSchema() },
      mediaTypes: {
        'application/xml': {
          async decode(response) {
            client.setConfig({ onValidationError: replacement })
            await Promise.resolve()
            return response.text()
          },
        },
      },
    })

    expect(result.data).toBe(perCall ? 'override' : 'initial')
    expect(perCall ? override : initial).toHaveBeenCalledOnce()
    expect(perCall ? initial : override).not.toHaveBeenCalled()
    expect(replacement).not.toHaveBeenCalled()
  })

  test.each([false, true])('keeps throwOnError=%s when a media type changes the client default', async (throwOnError) => {
    const { transport } = transportWith({ status: 422, contentType: 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport, throwOnError })
    const result = client({
      url: '/pet',
      mediaTypes: {
        'application/xml': {
          async decode() {
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

  test('runs the matching decode before validation and feeds result.data', async () => {
    const { transport } = transportWith({ data: '<pet><id>1</id></pet>', contentType: 'application/xml' })
    const parseXml = vi.fn(async (response: Response) => ({ id: (await response.text()).length }))
    const client = createClientCore<string, string>({ defaultTransport: transport, mediaTypes: { 'application/xml': { decode: parseXml } } })
    const result = await client({ method: 'GET', url: '/pet/1' })
    expect(result.data).toStrictEqual({ id: 21 })
    expect(result.contentType).toBe('application/xml')
  })

  test('encodes the request body with the media type of its content type', async () => {
    const { transport, calls } = transportWith({})
    const toXml = vi.fn((_body: unknown, _context: MediaTypeContext) => '<pet/>')
    const client = createClientCore<string, string>({ defaultTransport: transport, mediaTypes: { 'application/xml': { encode: toXml } } })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/xml; charset=utf-8' })
    expect(toXml.mock.calls[0]?.[0]).toStrictEqual({ name: 'odie' })
    expect(toXml.mock.calls[0]?.[1]).toMatchObject({ contentType: 'application/xml; charset=utf-8' })
    expect(calls[0]?.body).toBe('<pet/>')
    expect(calls[0]?.headers['Content-Type']).toBe('application/xml; charset=utf-8')
  })

  test('carries the negotiated content type onto a thrown ResponseError', async () => {
    const { transport } = transportWith({ data: '<error/>', status: 422, contentType: 'application/xml' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 422, contentType: 'application/xml', data: '<error/>' })
  })
})

describe('defaultTransport', () => {
  const bytes = new Uint8Array([0xff, 0xfb, 0x90, 0x00])

  test('returns the Response with the Request it sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } })),
    )
    const result = await defaultTransport({ url: 'https://example.test/speech', method: 'POST', headers: {}, body: 'hi' })
    expect(result.webResponse).toBe(result.response)
    expect(result.request).toBeInstanceOf(Request)
    expect(new Uint8Array(await result.webResponse.arrayBuffer())).toEqual(bytes)
  })

  test('decodes a binary body to a Blob through the client, and an unknown binary type with parseAs blob', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/vnd.custom' } })),
    )
    const client = createClientCore({ defaultTransport })
    const blob = (await client({ method: 'GET', url: 'https://example.test/file', parseAs: 'blob' })).data
    expect(blob).toBeInstanceOf(Blob)
    expect(new Uint8Array(await (blob as Blob).arrayBuffer())).toEqual(bytes)
  })

  test('passes the Next.js next option in the fetch init, which Request drops', async () => {
    const fetch = vi.fn(async (_input: Request, _init?: RequestInit) => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    await defaultTransport({ url: 'https://example.test/pet', method: 'GET', headers: {}, options: { next: { revalidate: 60 } } })
    expect(fetch.mock.calls[0]?.[1]).toStrictEqual({ next: { revalidate: 60 } })
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
    expect(await failed({ method: 'GET', url: '/pet/1', parseAs: 'blob' })).toMatchObject({ error: { message: 'gone' }, status: 404 })
    expect(await empty({ method: 'DELETE', url: '/pet/1' })).toMatchObject({ data: undefined, status: 204 })
  })

  test('carries a Request built from the resolved request, and response interceptors see the decoded result', async () => {
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
})

describe('createLazyClient', () => {
  test('creates the client on first use, with the config set before it', async () => {
    const { transport, calls } = fakeTransport()
    const create = vi.fn((config: ClientConfig<string, string>) => createClientCore<string, string>({ defaultTransport: transport, ...config }))
    const client = createLazyClient(create)

    client.setConfig({ baseURL: 'https://api.test' })
    client.setConfig({ headers: { 'X-A': '1' } })
    expect(client.getConfig()).toMatchObject({ baseURL: 'https://api.test', headers: { 'X-A': '1' } })
    expect(create).not.toHaveBeenCalled()

    await client({ method: 'GET', url: '/pet' })
    expect(create).toHaveBeenCalledOnce()
    expect(calls[0]).toMatchObject({ url: 'https://api.test/pet', headers: { 'X-A': '1' } })

    client.interceptors.request.use((request) => ({ ...request, url: `${request.url}?traced` }))
    await client({ method: 'GET', url: '/pet' })
    expect(calls[1]?.url).toBe('https://api.test/pet?traced')
    expect(create).toHaveBeenCalledOnce()
  })

  test('creates nothing when the module that holds it is imported', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const module = await import('./client.ts')
    expect(typeof module.client).toBe('function')
    expect(fetch).not.toHaveBeenCalled()
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

  test('joins a baseURL with a trailing slash without a double slash', () => {
    const { client } = createClient()
    expect(client.getUrl({ baseURL: 'https://example.com/api/', url: '/pet' })).toBe('https://example.com/api/pet')
    expect(client.getUrl({ baseURL: 'https://example.com/api', url: '/pet' })).toBe('https://example.com/api/pet')
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
    const result = await unwrapResult(Promise.resolve({ data: { id: 1 }, error: undefined }), true)
    expect(result).toStrictEqual({ id: 1 })
    expect(await unwrapResult(Promise.resolve({ data: { id: 1 }, error: undefined }), false)).toStrictEqual({ data: { id: 1 }, error: undefined })
  })

  test('resolveThrowOnError keeps the call value and falls back to the generated default', () => {
    expect(resolveThrowOnError(undefined, true)).toBe(true)
    expect(resolveThrowOnError(undefined, false)).toBe(false)
    expect(resolveThrowOnError(false, true)).toBe(false)
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

  test('sends every scheme of a requirement that needs several, and skips one with a scheme that has no token', async () => {
    const headers: Record<string, string> = {}
    const query: Record<string, unknown> = {}
    const tokens: Record<string, string> = { 'X-API-Key': 'key', session: 'sid' }
    await resolveAuth({
      security: [
        [
          { type: 'apiKey', name: 'X-API-Key', in: 'header' },
          { type: 'http', scheme: 'bearer' },
        ],
        [
          { type: 'apiKey', name: 'X-API-Key', in: 'header' },
          { type: 'apiKey', name: 'session', in: 'query' },
        ],
      ],
      // An async resolver, as an app that refreshes its token would pass.
      auth: async (auth) => (auth.name ? tokens[auth.name] : undefined),
      headers,
      query,
    })
    expect(headers).toStrictEqual({ 'X-API-Key': 'key' })
    expect(query).toStrictEqual({ session: 'sid' })
  })

  test('reads an async auth callback from the client for each call', async () => {
    const { transport, calls } = fakeTransport()
    let token = 'first'
    const client = createClientCore<string, string>({ defaultTransport: transport, auth: async () => token })
    const security: Array<Auth> = [{ type: 'http', scheme: 'bearer' }]
    await client({ method: 'GET', url: '/pet', security })
    token = 'refreshed'
    await client({ method: 'GET', url: '/pet', security })
    expect(calls.map((request) => request.headers.Authorization)).toStrictEqual(['Bearer first', 'Bearer refreshed'])
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
