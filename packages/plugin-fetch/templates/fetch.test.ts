import { describe, expect, test, vi } from 'vitest'
import {
  type CallResult,
  createClientCore,
  createInterceptorStack,
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

describe('resolveAuth', () => {
  test('places a bearer token on the Authorization header', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({
      security: [{ bearerAuth: [] }],
      schemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
      auth: () => 'token-123',
      headers,
      query: {},
    })
    expect(headers.Authorization).toBe('Bearer token-123')
  })

  test('encodes basic credentials', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({
      security: [{ basicAuth: [] }],
      schemes: { basicAuth: { type: 'http', scheme: 'basic' } },
      auth: () => ({ username: 'user', password: 'pass' }),
      headers,
      query: {},
    })
    expect(headers.Authorization).toBe(`Basic ${btoa('user:pass')}`)
  })

  test('places an api key in the configured location', async () => {
    const headers: Record<string, string> = {}
    const query: Record<string, unknown> = {}
    await resolveAuth({
      security: [{ apiKey: [] }],
      schemes: { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' } },
      auth: () => 'secret',
      headers,
      query,
    })
    expect(headers['X-API-Key']).toBe('secret')
    expect(query).toStrictEqual({})
  })

  test('does nothing without an auth callback', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ bearerAuth: [] }], schemes: {}, auth: undefined, headers, query: {} })
    expect(headers).toStrictEqual({})
  })
})
