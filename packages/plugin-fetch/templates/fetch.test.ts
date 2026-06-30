import { describe, expect, test, vi } from 'vitest'
import {
  type CallResult,
  createClientCore,
  createInterceptorStack,
  parseEventStream,
  type ResolvedRequest,
  ResponseError,
  resolveAuth,
  type ServerSentEvent,
  type Transport,
  type TransportResult,
} from './fetch.ts'
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
})

describe('defaultQuerySerializer', () => {
  test('explodes arrays into repeated keys', () => {
    expect(defaultQuerySerializer({ tags: ['a', 'b'] })).toBe('tags=a&tags=b')
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
  test('JSON-serializes plain objects', () => {
    expect(defaultBodySerializer({ body: { name: 'odie' } })).toBe('{"name":"odie"}')
  })

  test('passes FormData through untouched', () => {
    const formData = new FormData()
    expect(defaultBodySerializer({ body: formData })).toBe(formData)
  })

  test('encodes form-urlencoded objects as URLSearchParams', () => {
    const body = defaultBodySerializer({ body: { a: '1' }, contentType: 'application/x-www-form-urlencoded' })
    expect(body).toBeInstanceOf(URLSearchParams)
  })

  test('builds FormData from a plain object for multipart/form-data', () => {
    const body = defaultBodySerializer({ body: { field: 'x' }, contentType: 'multipart/form-data' })
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('field')).toBe('x')
  })

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
  test('builds the url from method, path interpolation, and query', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet/{petId}', path: { petId: 7 }, query: { sort: 'name' } })
    expect(calls[0]?.url).toBe('/pet/7?sort=name')
    expect(calls[0]?.method).toBe('GET')
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

  test('serializes the body and sets Content-Type', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/json' })
    expect(calls[0]?.body).toBe('{"name":"odie"}')
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
  })

  test('serializes cookie params into the Cookie header', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet', cookies: { session: 'abc', ids: [1, 2] } })
    expect(calls[0]?.headers.Cookie).toBe('session=abc; ids=1,2')
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

  test('builds FormData and omits Content-Type for multipart/form-data', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { field: 'x' }, contentType: 'multipart/form-data' })
    expect(calls[0]?.body).toBeInstanceOf(FormData)
    expect(calls[0]?.headers['Content-Type']).toBeUndefined()
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

  test('surfaces a non-2xx body as an error value when throwOnError is false', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405 })
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false })) as CallResult<string, string>
    expect(result).toStrictEqual({ status: 405, data: undefined, error: { message: 'invalid' }, contentType: undefined, request: 'REQ', response: 'RES' })
  })

  test('passes client-level options to the transport', async () => {
    const { transport, calls } = fakeTransport()
    const client = createClientCore<string, string>({ defaultTransport: transport, options: { cache: 'no-store' } })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.options).toStrictEqual({ cache: 'no-store' })
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

  test('setConfig merges and getConfig reflects it', () => {
    const { client } = createClient()
    client.setConfig({ baseURL: 'https://example.com' })
    expect(client.getConfig().baseURL).toBe('https://example.com')
  })

  test('createClient produces an instance with isolated interceptors', () => {
    const { client } = createClient()
    const child = client.createClient()
    child.interceptors.request.use((request) => request)
    expect(child).not.toBe(client)
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

  test('carries the negotiated content type onto result.contentType, charset stripped', async () => {
    const { transport } = transportWith({ data: { id: 1 }, contentType: 'application/xml; charset=utf-8' })
    const client = createClientCore<string, string>({ defaultTransport: transport })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult<string, string>
    expect(result.contentType).toBe('application/xml')
    expect(result.data).toStrictEqual({ id: 1 })
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

describe('resolveAuth', () => {
  test('places a bearer token on the Authorization header', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: () => 'token-123', headers, query: {} })
    expect(headers.Authorization).toBe('Bearer token-123')
  })

  test('base64-encodes a basic credential', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'basic' }], auth: () => 'user:pass', headers, query: {} })
    expect(headers.Authorization).toBe(`Basic ${btoa('user:pass')}`)
  })

  test('resolves oauth2 as a bearer token', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'oauth2' }], auth: () => 'token-123', headers, query: {} })
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
})

describe('parseEventStream', () => {
  function streamOf(chunks: Array<string>): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
        controller.close()
      },
    })
  }

  async function* asyncIterableOf(chunks: Array<string>): AsyncGenerator<Uint8Array> {
    const encoder = new TextEncoder()
    for (const chunk of chunks) yield encoder.encode(chunk)
  }

  async function collect<TData>(stream: AsyncIterable<TData>): Promise<Array<TData>> {
    const events: Array<TData> = []
    for await (const event of stream) events.push(event)
    return events
  }

  test('parses JSON data events split on a blank line', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"n":1}\n\n', 'data: {"n":2}\n\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }, { data: { n: 2 } }])
  })

  test('concatenates multi-line data with a newline', async () => {
    const events = await collect(parseEventStream<string>(streamOf(['data: line one\ndata: line two\n\n'])))
    expect(events).toStrictEqual([{ data: 'line one\nline two' }])
  })

  test('reads event, id, and retry fields', async () => {
    const events = await collect(parseEventStream(streamOf(['event: ping\nid: 42\nretry: 3000\ndata: {"ok":true}\n\n'])))
    expect(events).toStrictEqual([{ event: 'ping', id: '42', retry: 3000, data: { ok: true } }])
  })

  test('ignores comment and heartbeat lines', async () => {
    const events = await collect(parseEventStream(streamOf([': keep-alive\n\n', 'data: {"n":1}\n\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }])
  })

  test('keeps non-JSON data as a string', async () => {
    const events = await collect(parseEventStream<string>(streamOf(['data: hello world\n\n'])))
    expect(events).toStrictEqual([{ data: 'hello world' }])
  })

  test('normalizes CRLF line endings and flushes a trailing event', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"n":1}\r\n\r\ndata: {"n":2}\r\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }, { data: { n: 2 } }])
  })

  test('reassembles events split across chunks', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"hal', 'f":true}\n\n'])))
    expect(events).toStrictEqual([{ data: { half: true } }])
  })

  test('consumes an async iterable of byte chunks', async () => {
    const events = await collect(parseEventStream(asyncIterableOf(['data: {"n":1}\n\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }])
  })

  test('ignores a comment-only trailer without a blank-line terminator', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"n":1}\n\n: keep-alive\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }])
  })

  test('skips a blank trailing event', async () => {
    const events: Array<ServerSentEvent> = await collect(parseEventStream(streamOf(['data: {"n":1}\n\n\n\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }])
  })
})
