import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { describe, expect, test, vi } from 'vitest'
import { type CallResult, createClientCore, defaultBodySerializer, defaultPathSerializer, defaultQuerySerializer, ResponseError, resolveAuth } from './axios.ts'

type Programmed = { data?: unknown; status?: number; statusText?: string }

/**
 * A minimal axios instance stub that honors `validateStatus` the way axios does: a status the
 * predicate rejects throws an `AxiosError` carrying `response`/`config`, mirroring the real contract
 * the runtime rides for `throwOnError`.
 */
function fakeAxios(result: Programmed = {}) {
  const calls: Array<AxiosRequestConfig> = []
  const request = vi.fn(async (config: AxiosRequestConfig) => {
    calls.push(config)
    const status = result.status ?? 200
    const response = {
      data: result.data ?? { ok: true },
      status,
      statusText: result.statusText ?? 'OK',
      headers: {},
      config,
    } as unknown as AxiosResponse
    const validate = config.validateStatus ?? ((s: number) => s >= 200 && s < 300)
    if (!validate(status)) {
      throw Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, name: 'AxiosError', config, response }) as AxiosError
    }
    return response
  })
  const requestUse = vi.fn((_onFulfilled?: unknown, _onRejected?: unknown) => 1)
  const responseUse = vi.fn((_onFulfilled?: unknown, _onRejected?: unknown) => 2)
  const requestEject = vi.fn()
  const responseEject = vi.fn()
  const instance = {
    request,
    interceptors: {
      request: { use: requestUse, eject: requestEject, clear: vi.fn() },
      response: { use: responseUse, eject: responseEject, clear: vi.fn() },
    },
  } as unknown as AxiosInstance
  return { instance, calls, request, requestUse, responseUse, requestEject, responseEject }
}

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

describe('defaultPathSerializer', () => {
  test('URL-encodes a primitive value', () => {
    expect(defaultPathSerializer('id', 'a b')).toBe('a%20b')
  })

  test('joins array members with commas (simple style)', () => {
    expect(defaultPathSerializer('ids', [3, 4, 5])).toBe('3,4,5')
  })

  test('renders objects as comma-separated key=value pairs', () => {
    expect(defaultPathSerializer('point', { x: 1, y: 2 })).toBe('x=1,y=2')
  })

  test('serializes undefined and null to an empty string', () => {
    expect(defaultPathSerializer('id', undefined)).toBe('')
    expect(defaultPathSerializer('id', null)).toBe('')
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
  test('returns the success shape with data and an undefined error', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const client = createClientCore({ transport: instance })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult
    expect(result.status).toBe(200)
    expect(result.data).toStrictEqual({ id: 1 })
    expect(result.error).toBeUndefined()
    expect(result.request).toBeDefined()
    expect(result.response).toBeDefined()
  })

  test('interpolates path params and passes the query as axios params', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet/{petId}', path: { petId: 7 }, query: { sort: 'name' } })
    expect(calls[0]?.url).toBe('/pet/7')
    expect(calls[0]?.params).toStrictEqual({ sort: 'name' })
    expect(calls[0]?.method).toBe('GET')
  })

  test('serializes array and object path params instead of [object Object]', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet/{ids}/{point}', path: { ids: [3, 4], point: { x: 1, y: 2 } } })
    expect(calls[0]?.url).toBe('/pet/3,4/x=1,y=2')
  })

  test('forwards the merged baseURL to axios', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, baseURL: 'https://api.test' })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.baseURL).toBe('https://api.test')
  })

  test('maps querySerializer onto axios paramsSerializer', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet', query: { tags: ['a', 'b'] } })
    const serializer = calls[0]?.paramsSerializer as (params: Record<string, unknown>) => string
    expect(serializer({ tags: ['a', 'b'] })).toBe('tags=a&tags=b')
  })

  test('serializes the body before axios and sets Content-Type', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/json' })
    expect(calls[0]?.data).toBe('{"name":"odie"}')
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  test('builds FormData and omits Content-Type for multipart/form-data', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { field: 'x' }, contentType: 'multipart/form-data' })
    expect(calls[0]?.data).toBeInstanceOf(FormData)
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
  })

  test('omits Content-Type when a pre-built FormData body is sent', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const formData = new FormData()
    formData.append('field', 'x')
    await client({ method: 'POST', url: '/pet', body: formData, contentType: 'application/json' })
    expect(calls[0]?.data).toBe(formData)
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
  })

  test('throws a ResponseError for a non-2xx status by default', async () => {
    const { instance } = fakeAxios({ data: { message: 'invalid' }, status: 405, statusText: 'Method Not Allowed' })
    const client = createClientCore({ transport: instance })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 405, data: { message: 'invalid' } })
  })

  test('surfaces a non-2xx body as an error value when throwOnError is false', async () => {
    const { instance, calls } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ transport: instance })
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false })) as CallResult
    expect(result.data).toBeUndefined()
    expect(result.error).toStrictEqual({ message: 'invalid' })
    expect((calls[0]?.validateStatus as (s: number) => boolean)(405)).toBe(true)
  })

  test('a user-provided validateStatus wins over throwOnError', async () => {
    const { instance, calls } = fakeAxios({ data: { message: 'nope' }, status: 404 })
    const client = createClientCore({ transport: instance })
    const result = (await client({ method: 'GET', url: '/pet', validateStatus: () => true })) as CallResult
    expect(result.error).toStrictEqual({ message: 'nope' })
    expect((calls[0]?.validateStatus as (s: number) => boolean)(404)).toBe(true)
  })

  test('rethrows a network error without a response', async () => {
    const networkError = Object.assign(new Error('Network Error'), { isAxiosError: true, name: 'AxiosError' }) as AxiosError
    const instance = {
      request: vi.fn(async () => {
        throw networkError
      }),
      interceptors: {
        request: { use: vi.fn(() => 0), eject: vi.fn(), clear: vi.fn() },
        response: { use: vi.fn(() => 0), eject: vi.fn(), clear: vi.fn() },
      },
    } as unknown as AxiosInstance
    const client = createClientCore({ transport: instance })
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBe(networkError)
  })

  test('resolves the per-call transport over the default instance', async () => {
    const base = fakeAxios()
    const override = fakeAxios({ data: { from: 'override' } })
    const client = createClientCore({ transport: base.instance })
    const result = (await client({ method: 'GET', url: '/pet', transport: override.instance })) as CallResult
    expect(override.request).toHaveBeenCalledTimes(1)
    expect(base.request).not.toHaveBeenCalled()
    expect(result.data).toStrictEqual({ from: 'override' })
  })

  test('runs the request parser before the send and the response parser on success', async () => {
    const { instance, calls } = fakeAxios({ data: { raw: true }, status: 200 })
    const client = createClientCore({ transport: instance })
    const request = vi.fn((body: unknown) => ({ ...(body as object), validated: true }))
    const response = vi.fn(() => ({ parsed: true }))
    const result = (await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, parser: { request, response } })) as CallResult
    expect(request).toHaveBeenCalledTimes(1)
    expect(calls[0]?.data).toBe('{"name":"odie","validated":true}')
    expect(result.data).toStrictEqual({ parsed: true })
  })

  test('skips the response parser on a non-2xx body', async () => {
    const { instance } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ transport: instance })
    const response = vi.fn((value: unknown) => value)
    await client({ method: 'POST', url: '/pet', throwOnError: false, parser: { response } })
    expect(response).not.toHaveBeenCalled()
  })

  test('runs the error parser on a non-2xx body when throwOnError is false', async () => {
    const { instance } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ transport: instance })
    const error = vi.fn(() => ({ parsed: true }))
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false, parser: { error } })) as CallResult
    expect(error).toHaveBeenCalledTimes(1)
    expect(result.error).toStrictEqual({ parsed: true })
  })

  test('skips the error parser on a success body', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const client = createClientCore({ transport: instance })
    const error = vi.fn((value: unknown) => value)
    await client({ method: 'GET', url: '/pet/1', throwOnError: false, parser: { error } })
    expect(error).not.toHaveBeenCalled()
  })

  test('delegates interceptors to the native axios managers', () => {
    const { instance, requestUse, responseUse } = fakeAxios()
    const client = createClientCore({ transport: instance })
    client.interceptors.request.use((config) => config)
    expect(requestUse).toHaveBeenCalledTimes(1)
    client.interceptors.response.use((response) => response)
    expect(responseUse).toHaveBeenCalledTimes(1)
    client.interceptors.error.use((error) => error)
    expect(responseUse).toHaveBeenCalledTimes(2)
    expect(responseUse.mock.calls[1]?.[0]).toBeUndefined()
  })

  test('eject removes a native interceptor by its mapped id', () => {
    const { instance, requestEject } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const id = client.interceptors.request.use((config) => config)
    client.interceptors.request.eject(id)
    expect(requestEject).toHaveBeenCalledWith(1)
  })

  test('setConfig merges and getConfig reflects it', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    client.setConfig({ baseURL: 'https://example.com' })
    expect(client.getConfig().baseURL).toBe('https://example.com')
  })

  test('createClient produces a new instance', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const child = client.createClient()
    expect(child).not.toBe(client)
  })
})

describe('getUrl', () => {
  test('interpolates path params and serializes the query', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, query: { status: ['a', 'b'] } })).toBe('/pet/7?status=a&status=b')
  })

  test('prefixes the configured baseURL', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance, baseURL: 'https://example.com' })
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 1 } })).toBe('https://example.com/pet/1')
  })

  test('prefixes a per-call baseURL', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ baseURL: 'https://example.com', url: '/pet' })).toBe('https://example.com/pet')
  })

  test('uses a per-call querySerializer override', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pet', query: { a: 1 }, querySerializer: () => 'custom=1' })).toBe('/pet?custom=1')
  })

  test('uses a per-call pathSerializer override', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, pathSerializer: (_name, value) => `id-${value as string}` })).toBe('/pet/id-7')
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

  test('accepts a static token without a callback', async () => {
    const headers: Record<string, string> = {}
    await resolveAuth({ security: [{ type: 'http', scheme: 'bearer' }], auth: 'token-123', headers, query: {} })
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
