import { describe, expect, test, vi } from 'vitest'
import {
  type CallResult,
  createClientCore,
  createInterceptorStack,
  createQuerySerializer,
  defaultBodySerializer,
  defaultQuerySerializer,
  type ResolvedRequest,
  ResponseError,
  resolveAuth,
  type Transport,
  type TransportResult,
} from './fetch.ts'

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
})

describe('createQuerySerializer', () => {
  test('with no options matches the default serializer', () => {
    const serializer = createQuerySerializer()
    expect(serializer({ tags: ['a', 'b'], filter: { name: 'odie' } })).toBe('tags=a&tags=b&filter%5Bname%5D=odie')
  })

  test('joins arrays with a comma for form style without explode', () => {
    const serializer = createQuerySerializer({ array: { style: 'form', explode: false } })
    expect(serializer({ tags: ['a', 'b'] })).toBe('tags=a,b')
  })

  test('joins arrays with %20 for spaceDelimited style', () => {
    const serializer = createQuerySerializer({ array: { style: 'spaceDelimited', explode: false } })
    expect(serializer({ tags: ['a', 'b'] })).toBe('tags=a%20b')
  })

  test('joins arrays with a pipe for pipeDelimited style', () => {
    const serializer = createQuerySerializer({ array: { style: 'pipeDelimited', explode: false } })
    expect(serializer({ tags: ['a', 'b'] })).toBe('tags=a|b')
  })

  test('explodes objects into top-level keys for form style', () => {
    const serializer = createQuerySerializer({ object: { style: 'form', explode: true } })
    expect(serializer({ filter: { name: 'odie', age: 3 } })).toBe('name=odie&age=3')
  })

  test('joins object entries for form style without explode', () => {
    const serializer = createQuerySerializer({ object: { style: 'form', explode: false } })
    expect(serializer({ filter: { name: 'odie', age: 3 } })).toBe('filter=name,odie,age,3')
  })

  test('leaves reserved characters unencoded when allowReserved is set', () => {
    const serializer = createQuerySerializer({ allowReserved: true })
    expect(serializer({ path: '/pets/1' })).toBe('path=/pets/1')
  })

  test('encodes reserved characters by default', () => {
    expect(defaultQuerySerializer({ path: '/pets/1' })).toBe('path=%2Fpets%2F1')
  })

  test('skips empty arrays', () => {
    expect(defaultQuerySerializer({ tags: [], a: 1 })).toBe('a=1')
  })
})

describe('defaultBodySerializer', () => {
  test('JSON-serializes plain objects', () => {
    expect(defaultBodySerializer({ name: 'odie' })).toBe('{"name":"odie"}')
  })

  test('passes FormData through untouched', () => {
    const formData = new FormData()
    expect(defaultBodySerializer(formData)).toBe(formData)
  })

  test('encodes form-urlencoded objects as URLSearchParams', () => {
    const body = defaultBodySerializer({ a: '1' }, 'application/x-www-form-urlencoded')
    expect(body).toBeInstanceOf(URLSearchParams)
  })

  test('builds FormData from a plain object for multipart/form-data', () => {
    const body = defaultBodySerializer({ field: 'x' }, 'multipart/form-data')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('field')).toBe('x')
  })

  test('passes Blob members through and serializes dates, objects, and arrays in multipart', () => {
    const file = new Blob(['hi'], { type: 'text/plain' })
    const body = defaultBodySerializer(
      { file, when: new Date('2020-01-01T00:00:00.000Z'), meta: { a: 1 }, tags: ['a', 'b'] },
      'multipart/form-data',
    ) as FormData
    expect(body.get('file')).toBeInstanceOf(Blob)
    expect(body.get('when')).toBe('2020-01-01T00:00:00.000Z')
    expect(body.get('meta')).toBe('{"a":1}')
    expect(body.getAll('tags')).toStrictEqual(['a', 'b'])
  })

  test('passes a pre-built FormData through untouched for multipart', () => {
    const formData = new FormData()
    expect(defaultBodySerializer(formData, 'multipart/form-data')).toBe(formData)
  })
})

describe('createClientCore', () => {
  test('builds the url from method, path interpolation, and query', async () => {
    const { client, calls } = createClient()
    await client({ method: 'GET', url: '/pet/{petId}', path: { petId: 7 }, query: { sort: 'name' } })
    expect(calls[0]?.url).toBe('/pet/7?sort=name')
    expect(calls[0]?.method).toBe('GET')
  })

  test('serializes the body and sets Content-Type', async () => {
    const { client, calls } = createClient()
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/json' })
    expect(calls[0]?.body).toBe('{"name":"odie"}')
    expect(calls[0]?.headers['Content-Type']).toBe('application/json')
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
    expect(result).toStrictEqual({ status: 200, data: { id: 1 }, error: undefined, request: 'REQ', response: 'RES' })
  })

  test('throws a ResponseError for a non-2xx status by default', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405, statusText: 'Method Not Allowed' })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 405, data: { message: 'invalid' } })
  })

  test('surfaces a non-2xx body as an error value when throwOnError is false', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405 })
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false })) as CallResult<string, string>
    expect(result).toStrictEqual({ status: 405, data: undefined, error: { message: 'invalid' }, request: 'REQ', response: 'RES' })
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
    const result = (await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, parser: { request, response } })) as CallResult<string, string>
    expect(request).toHaveBeenCalledTimes(1)
    expect(calls[0]?.body).toBe('{"name":"odie","validated":true}')
    expect(result.data).toStrictEqual({ parsed: true })
  })

  test('skips the response parser on a non-2xx body', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405 })
    const response = vi.fn((value: unknown) => value)
    await client({ method: 'POST', url: '/pet', throwOnError: false, parser: { response } })
    expect(response).not.toHaveBeenCalled()
  })

  test('runs the error parser on a non-2xx body when throwOnError is false', async () => {
    const { client } = createClient({ data: { message: 'invalid' }, status: 405 })
    const error = vi.fn(() => ({ parsed: true }))
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false, parser: { error } })) as CallResult<string, string>
    expect(error).toHaveBeenCalledTimes(1)
    expect(result).toStrictEqual({ status: 405, data: undefined, error: { parsed: true }, request: 'REQ', response: 'RES' })
  })

  test('skips the error parser on a success body', async () => {
    const { client } = createClient({ data: { id: 1 }, status: 200 })
    const error = vi.fn((value: unknown) => value)
    await client({ method: 'GET', url: '/pet/1', throwOnError: false, parser: { error } })
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

  test('uses a per-call querySerializer override', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pet', query: { a: 1 }, querySerializer: () => 'custom=1' })).toBe('/pet?custom=1')
  })

  test('builds a serializer from a querySerializer options object', () => {
    const { client } = createClient()
    expect(client.getUrl({ url: '/pet', query: { tags: ['a', 'b'] }, querySerializer: { array: { style: 'pipeDelimited', explode: false } } })).toBe(
      '/pet?tags=a|b',
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
