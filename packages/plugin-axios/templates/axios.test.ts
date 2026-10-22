import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios, { AxiosError as AxiosErrorClass } from 'axios'
import { describe, expect, test, vi } from 'vitest'
import { type CallResult, type ClientConfig, createClientCore, parseEventStream, ResponseError, resolveAuth, unwrapResult, withUnwrap } from './axios.ts'

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

function toSchema<T>(transform: (value: unknown) => T) {
  return { '~standard': { validate: (value: unknown) => ({ value: transform(value) }) } }
}

function toFailingSchema(message = 'invalid') {
  return { '~standard': { validate: () => ({ issues: [{ message, path: ['name'] }] }) } }
}

describe('createClientCore', () => {
  test('sends through defaultTransport and gives createClient a fresh instance', async () => {
    const { instance, request } = fakeAxios()
    const client = createClientCore({ defaultTransport: instance })
    await client({ method: 'GET', url: '/pet' })
    expect(request).toHaveBeenCalledOnce()

    expect(client.createClient().getConfig()).not.toHaveProperty('defaultTransport')
  })

  test('returns errors for a non-throwing call and honors a per-call override', async () => {
    const { instance } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ transport: instance })
    const result = await unwrapResult(client({ method: 'GET', url: '/pet', throwOnError: false }), false)
    expect(result).toMatchObject({ status: 405, error: { message: 'invalid' } })
    await expect(client({ method: 'GET', url: '/pet', throwOnError: true })).rejects.toBeInstanceOf(ResponseError)
  })
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
    expect(calls[0]?.url).toBe('/pet/3,4/x,1,y,2')
  })

  test('honors per-parameter styles.path metadata', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({
      method: 'GET',
      url: '/pet/{id}{filter}',
      path: { id: 5, filter: ['a', 'b'] },
      styles: { path: { id: { style: 'matrix' }, filter: { style: 'label' } } },
    })
    expect(calls[0]?.url).toBe('/pet/;id=5.a,b')
  })

  test('forwards the client-level baseURL to axios', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, baseURL: 'https://api.test' })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.baseURL).toBe('https://api.test')
  })

  test('a per-call baseURL replaces the client-level baseURL', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, baseURL: 'https://api.test' })
    await client({ method: 'GET', url: '/pet', baseURL: 'https://override.test' })
    expect(calls[0]?.baseURL).toBe('https://override.test')
  })

  test('an explicit Authorization header on the call wins over the auth resolver', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, auth: () => 'token-123' })
    await client({ method: 'GET', url: '/pet', security: [{ type: 'http', scheme: 'bearer' }], headers: { Authorization: 'Bearer explicit' } })
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer explicit')
  })

  test('passes client-level axiosOptions to axios', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, options: { timeout: 1000 } })
    await client({ method: 'GET', url: '/pet' })
    expect(calls[0]?.timeout).toBe(1000)
  })

  test('merges request-level axiosOptions over client-level', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, options: { timeout: 1000, maxRedirects: 5 } })
    await client({ method: 'GET', url: '/pet', options: { timeout: 2000, decompress: false } })
    expect(calls[0]?.timeout).toBe(2000)
    expect(calls[0]?.maxRedirects).toBe(5)
    expect(calls[0]?.decompress).toBe(false)
  })

  test('never lets options override the runtime-owned fields', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet/{petId}', path: { petId: 7 }, options: { url: '/evil', method: 'DELETE' } })
    expect(calls[0]?.url).toBe('/pet/7')
    expect(calls[0]?.method).toBe('GET')
  })

  test('maps querySerializer onto axios paramsSerializer', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet', query: { tags: ['a', 'b'] } })
    const serializer = calls[0]?.paramsSerializer as (params: Record<string, unknown>) => string
    expect(serializer({ tags: ['a', 'b'] })).toBe('tags=a&tags=b')
  })

  test('passes styles.query through the axios paramsSerializer', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet', query: { id: [3, 4, 5] }, styles: { query: { id: { style: 'pipeDelimited', explode: false } } } })
    const serializer = calls[0]?.paramsSerializer as (params: Record<string, unknown>) => string
    expect(serializer({ id: [3, 4, 5] })).toBe('id=3|4|5')
  })

  test('defaults stream responses to the fetch adapter so the browser streams the body', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/events', responseType: 'stream' })
    expect(calls[0]?.adapter).toBe('fetch')
  })

  test('respects an explicit adapter on a stream request', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/events', responseType: 'stream', options: { adapter: 'http' } })
    expect(calls[0]?.adapter).toBe('http')
  })

  test('leaves non-stream requests on the default adapter', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet/1' })
    expect(calls[0]?.adapter).toBeUndefined()
  })

  test('serializes the body before axios and sets Content-Type', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/json' })
    expect(calls[0]?.data).toBe('{"name":"odie"}')
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  test('sends a QUERY request with its JSON body', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'QUERY', url: '/pet/search', body: { name: 'odie' } })
    expect(calls[0]?.method).toBe('QUERY')
    expect(calls[0]?.data).toBe('{"name":"odie"}')
  })

  test('serializes JSON body without explicit contentType and sets Content-Type', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/v3/jwt/token/', body: { email: 'test@example.com', password: 'secret' } })
    expect(calls[0]?.data).toBe('{"email":"test@example.com","password":"secret"}')
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  test('does not override a caller-set Content-Type header', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, headers: { 'content-type': 'application/vnd.api+json' } })
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['content-type']).toBe('application/vnd.api+json')
    expect(headers['Content-Type']).toBeUndefined()
  })

  test('does not duplicate Content-Type when a mixed-case header is set', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, headers: { 'Content-type': 'application/vnd.api+json' } })
    const headers = calls[0]?.headers as Record<string, string>
    const contentTypeKeys = Object.keys(headers).filter((k) => k.toLowerCase() === 'content-type')
    expect(contentTypeKeys).toHaveLength(1)
    expect(headers['Content-type']).toBe('application/vnd.api+json')
  })

  test('does not auto-inject Content-Type when a custom bodySerializer is used', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, serializer: { body: ({ body }) => `custom:${JSON.stringify(body)}` } })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' } })
    expect(calls[0]?.data).toBe('custom:{"name":"odie"}')
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
  })

  test('serializes cookie params into the Cookie header', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet', cookies: { session: 'abc', ids: [1, 2] } })
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers.Cookie).toBe('session=abc; ids=1,2')
  })

  test('serializes array and object header params with the simple style', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({
      method: 'GET',
      url: '/pet',
      headers: { 'X-Ids': [3, 4], 'X-Filter': { role: 'admin' } },
      styles: { header: { 'X-Ids': {}, 'X-Filter': { explode: true } } },
    })
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['X-Ids']).toBe('3,4')
    expect(headers['X-Filter']).toBe('role=admin')
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

    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const path: PetPath = { petId: 7 }
    const headers: PetHeaders = { 'X-Request-Id': 'abc' }
    const cookies: PetCookies = { session: 'xyz' }
    await client({ method: 'GET', url: '/pet/{petId}', path, headers, cookies })

    expect(calls[0]?.url).toBe('/pet/7')
    const resultHeaders = calls[0]?.headers as Record<string, string>
    expect(resultHeaders['X-Request-Id']).toBe('abc')
    expect(resultHeaders.Cookie).toBe('session=xyz')
  })

  test('builds FormData and omits Content-Type for multipart/form-data', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { field: 'x' }, contentType: 'multipart/form-data' })
    expect(calls[0]?.data).toBeInstanceOf(FormData)
    const headers = calls[0]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
  })

  test('sends a form-urlencoded body as a string axios can transmit on Node', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/foo', body: { foo: 'a b' }, contentType: 'application/x-www-form-urlencoded' })
    await client({ method: 'POST', url: '/foo', body: new URLSearchParams({ foo: 'a b' }) })
    for (const call of calls) {
      const transform = call.transformRequest as (data: unknown) => unknown
      expect(transform(call.data)).toBe('foo=a+b')
    }
    for (const call of calls) expect((call.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded')
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

  test('names the method and URL in the ResponseError message, without the query', async () => {
    const { instance } = fakeAxios({ status: 404, statusText: 'Not Found' })
    const client = createClientCore({ transport: instance, baseURL: 'https://api.test' })
    await expect(client({ method: 'GET', url: '/pet/1?api_key=secret' })).rejects.toThrow('GET https://api.test/pet/1 failed with status 404 Not Found')
  })

  test('ResponseError keeps the bare message without a method or URL', () => {
    const error = new ResponseError({ data: undefined, status: 500, statusText: '', request: {}, response: {} as AxiosResponse })
    expect(error.message).toBe('Request failed with status 500')
  })

  test('ResponseError formats message with only method or only URL', () => {
    const errorMethodOnly = new ResponseError({
      data: undefined,
      status: 500,
      statusText: 'Server Error',
      request: {},
      response: {} as AxiosResponse,
      method: 'POST',
    })
    expect(errorMethodOnly.message).toBe('POST failed with status 500 Server Error')

    const errorUrlOnly = new ResponseError({
      data: undefined,
      status: 404,
      statusText: 'Not Found',
      request: {},
      response: {} as AxiosResponse,
      url: 'https://api.test/pet',
    })
    expect(errorUrlOnly.message).toBe('https://api.test/pet failed with status 404 Not Found')
  })

  test('ResponseError.is matches by name, so an error from another bundled client still counts', () => {
    const foreign = Object.assign(new Error('boom'), { name: 'ResponseError' })
    expect(ResponseError.is(foreign)).toBe(true)
    expect(ResponseError.is(new ResponseError({ data: undefined, status: 500, statusText: '', request: {}, response: {} as AxiosResponse }))).toBe(true)
    expect(ResponseError.is(new Error('boom'))).toBe(false)
    expect(ResponseError.is({ name: 'ResponseError' })).toBe(false)
    expect(ResponseError.is(null)).toBe(false)
    expect(ResponseError.is(undefined)).toBe(false)
  })

  test('strips query parameters and hash fragments from URL in ResponseError message', async () => {
    const { instance } = fakeAxios({ status: 404, statusText: 'Not Found' })
    const client = createClientCore({ transport: instance, baseURL: 'https://api.test' })
    await expect(client({ method: 'GET', url: '/pet/1?api_key=secret#details' })).rejects.toThrow('GET https://api.test/pet/1 failed with status 404 Not Found')
  })

  test('prevents double slashes when baseURL ends with a slash', async () => {
    const { instance } = fakeAxios({ status: 404, statusText: 'Not Found' })
    const client = createClientCore({ transport: instance, baseURL: 'https://api.test/' })
    await expect(client({ method: 'GET', url: '/pet/1' })).rejects.toThrow('GET https://api.test/pet/1 failed with status 404 Not Found')
  })

  test('ResponseError.is acts as a type guard narrowing data and status', () => {
    const err: unknown = new ResponseError<{ message: string }>({
      data: { message: 'invalid' },
      status: 400,
      statusText: 'Bad Request',
      request: {},
      response: {} as AxiosResponse,
    })
    if (ResponseError.is(err)) {
      expect(err.status).toBe(400)
      expect(err.data).toStrictEqual({ message: 'invalid' })
      expect(err.statusText).toBe('Bad Request')
    } else {
      expect.fail('Expected ResponseError.is to return true')
    }
  })

  test('passes an explicit 2xx-only validateStatus to axios when throwOnError is true by default', async () => {
    const { instance, calls } = fakeAxios({ data: { id: 1 }, status: 200 })
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet/1' })
    const validateStatus = calls[0]?.validateStatus as (s: number) => boolean
    expect(validateStatus).toBeTypeOf('function')
    expect(validateStatus(200)).toBe(true)
    expect(validateStatus(401)).toBe(false)
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
    const result = (await client({
      method: 'POST',
      url: '/pet',
      body: { name: 'odie' },
      validator: { request: toSchema(request), response: toSchema(response) },
    })) as CallResult
    expect(request).toHaveBeenCalledTimes(1)
    expect(calls[0]?.data).toBe('{"name":"odie","validated":true}')
    expect(result.data).toStrictEqual({ parsed: true })
  })

  test('skips the response parser on a non-2xx body', async () => {
    const { instance } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ transport: instance })
    const response = vi.fn((value: unknown) => value)
    await client({ method: 'POST', url: '/pet', throwOnError: false, validator: { response: toSchema(response) } })
    expect(response).not.toHaveBeenCalled()
  })

  test('runs the error parser on a non-2xx body when throwOnError is false', async () => {
    const { instance } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ transport: instance })
    const error = vi.fn(() => ({ parsed: true }))
    const result = (await client({ method: 'POST', url: '/pet', throwOnError: false, validator: { error: toSchema(error) } })) as CallResult
    expect(error).toHaveBeenCalledTimes(1)
    expect(result.error).toStrictEqual({ parsed: true })
  })

  test('throws the ParseError when no onValidationError is set', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const client = createClientCore({ transport: instance })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })).rejects.toMatchObject({
      name: 'ParseError',
      issues: [{ message: 'invalid', path: ['name'] }],
    })
  })

  test('resolves with the substituted value when onValidationError returns one', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const onValidationError = vi.fn((_error: unknown, context: { value: unknown }) => ({ value: context.value }))
    const client = createClientCore({ transport: instance, onValidationError })
    const result = (await client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })) as CallResult
    expect(result.data).toStrictEqual({ id: 1 })
    expect(onValidationError).toHaveBeenCalledTimes(1)
    expect(onValidationError.mock.calls[0]?.[1]).toMatchObject({
      direction: 'response',
      source: 'body',
      method: 'GET',
      url: '/pet/1',
      status: 200,
      value: { id: 1 },
    })
  })

  test('rethrows when onValidationError returns nothing', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const onValidationError = vi.fn(() => undefined)
    const client = createClientCore({ transport: instance, onValidationError })
    await expect(client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
    expect(onValidationError).toHaveBeenCalledTimes(1)
  })

  test('reports a failing request body with the request direction', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const onValidationError = vi.fn(() => ({ value: { name: 'odie' } }))
    const client = createClientCore({ transport: instance, onValidationError })
    await client({ method: 'POST', url: '/pet', body: { name: 1 }, validator: { request: toFailingSchema() } })
    expect(onValidationError.mock.calls[0]?.[1]).toMatchObject({ direction: 'request', source: 'body', method: 'POST', url: '/pet', value: { name: 1 } })
  })

  test('prefers the per-call onValidationError over the client one', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const clientLevel = vi.fn(() => ({ value: 'client' }))
    const perCall = vi.fn(() => ({ value: 'call' }))
    const client = createClientCore({ transport: instance, onValidationError: clientLevel })
    const result = (await client({ method: 'GET', url: '/pet/1', validator: { response: toFailingSchema() }, onValidationError: perCall })) as CallResult
    expect(result.data).toBe('call')
    expect(clientLevel).not.toHaveBeenCalled()
  })

  test('skips the error parser on a success body', async () => {
    const { instance } = fakeAxios({ data: { id: 1 }, status: 200 })
    const client = createClientCore({ transport: instance })
    const error = vi.fn((value: unknown) => value)
    await client({ method: 'GET', url: '/pet/1', throwOnError: false, validator: { error: toSchema(error) } })
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

  describe('interceptors across a transport set through setConfig', () => {
    // Real instances, so the interceptors run through axios's own managers.
    function realAxios(status = 200) {
      return axios.create({
        adapter: async (config) => {
          const response = { data: { ok: status < 300 }, status, statusText: status < 300 ? 'OK' : 'Bad Request', headers: {}, config }
          if (status >= 300)
            throw new AxiosErrorClass(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, undefined, response as AxiosResponse)
          return response as AxiosResponse
        },
      })
    }

    test('runs request, response, and error interceptors registered before the swap', async () => {
      const client = createClientCore()
      const seen: Array<string> = []
      client.interceptors.request.use((config) => (seen.push('request'), config))
      client.interceptors.response.use((response) => (seen.push('response'), response))
      client.interceptors.error.use((error) => (seen.push('error'), error))

      client.setConfig({ transport: realAxios() })
      await client({ method: 'GET', url: '/pet' })
      client.setConfig({ transport: realAxios(400) })
      await expect(client({ method: 'GET', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)

      expect(seen).toStrictEqual(['request', 'response', 'request', 'error'])
    })

    test('leaves nothing on the previous transport and still ejects by the original id', async () => {
      const previous = realAxios()
      const client = createClientCore({ transport: previous })
      const request = vi.fn((config: InternalAxiosRequestConfig) => config)
      const id = client.interceptors.request.use(request)

      client.setConfig({ transport: realAxios() })
      await previous.request({ url: '/direct' })
      expect(request).not.toHaveBeenCalled()

      client.interceptors.request.eject(id)
      await client({ method: 'GET', url: '/pet' })
      expect(request).not.toHaveBeenCalled()
    })

    test('moves them back to the original instance when the transport is cleared', async () => {
      const original = realAxios()
      const client = createClientCore({ transport: original })
      const request = vi.fn((config: InternalAxiosRequestConfig) => config)
      client.interceptors.request.use(request)

      client.setConfig({ transport: realAxios() })
      client.setConfig({ transport: undefined })
      await client({ method: 'GET', url: '/pet' })

      expect(request).toHaveBeenCalledOnce()
    })

    test('updates an interceptor after transport swap and honors the new handler', async () => {
      const client = createClientCore()
      const first = vi.fn((config: InternalAxiosRequestConfig) => config)
      const second = vi.fn((config: InternalAxiosRequestConfig) => config)
      const id = client.interceptors.request.use(first)

      client.setConfig({ transport: realAxios() })
      client.interceptors.request.update(id, second)
      await client({ method: 'GET', url: '/pet' })

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledOnce()
    })

    test('runs interceptors registered after the transport swap', async () => {
      const client = createClientCore()
      client.setConfig({ transport: realAxios() })

      const request = vi.fn((config: InternalAxiosRequestConfig) => config)
      client.interceptors.request.use(request)
      await client({ method: 'GET', url: '/pet' })

      expect(request).toHaveBeenCalledOnce()
    })

    test('passes requestConfig context to interceptors on the swapped transport', async () => {
      const client = createClientCore()
      let capturedContext: unknown = null
      client.interceptors.request.use((config, context) => {
        capturedContext = context
        return config
      })

      client.setConfig({ transport: realAxios() })
      await client({ method: 'GET', url: '/pet', path: { test: '123' } })

      expect(capturedContext).toMatchObject({ path: { test: '123' } })
    })

    test('does not detach and re-attach when setConfig does not change transport', async () => {
      const transport = realAxios()
      const client = createClientCore({ transport })
      const request = vi.fn((config: InternalAxiosRequestConfig) => config)
      client.interceptors.request.use(request)

      client.setConfig({ baseURL: 'https://api.test' })
      await client({ method: 'GET', url: '/pet' })

      expect(request).toHaveBeenCalledOnce()
    })

    test('handles multiple sequential transport swaps preserving interceptors', async () => {
      const defaultTransport = realAxios()
      const client = createClientCore({ transport: defaultTransport })
      const seen: Array<string> = []
      client.interceptors.request.use((config) => {
        seen.push(`req-${config.url}`)
        return config
      })

      const transportA = realAxios()
      const transportB = realAxios()
      const transportC = realAxios()

      client.setConfig({ transport: transportA })
      await client({ method: 'GET', url: '/call-a' })

      client.setConfig({ transport: transportB })
      await client({ method: 'GET', url: '/call-b' })

      client.setConfig({ transport: transportC })
      await client({ method: 'GET', url: '/call-c' })

      client.setConfig({ transport: undefined })
      await client({ method: 'GET', url: '/call-default' })

      expect(seen).toStrictEqual(['req-/call-a', 'req-/call-b', 'req-/call-c', 'req-/call-default'])
    })

    test('propagates errors through error interceptors on swapped transport', async () => {
      const client = createClientCore()
      const errorCalls: Array<number | undefined> = []
      client.interceptors.error.use((error) => {
        errorCalls.push(error.response?.status)
        return error
      })

      client.setConfig({ transport: realAxios(500) })
      await expect(client({ method: 'GET', url: '/error-test' })).rejects.toThrow()

      expect(errorCalls).toStrictEqual([500])
    })

    test('safely handles eject with unknown or previously ejected id after transport swap', async () => {
      const client = createClientCore()
      const reqFn = vi.fn((config: InternalAxiosRequestConfig) => config)
      const id = client.interceptors.request.use(reqFn)

      client.setConfig({ transport: realAxios() })

      expect(() => client.interceptors.request.eject(9999)).not.toThrow()
      client.interceptors.request.eject(id)
      expect(() => client.interceptors.request.eject(id)).not.toThrow()

      await client({ method: 'GET', url: '/test' })
      expect(reqFn).not.toHaveBeenCalled()
    })

    test('preserves relative execution order of multiple request and response interceptors across swap', async () => {
      const client = createClientCore()
      const executionOrder: Array<string> = []

      client.interceptors.request.use((config) => {
        executionOrder.push('req1')
        return config
      })
      client.interceptors.request.use((config) => {
        executionOrder.push('req2')
        return config
      })
      client.interceptors.response.use((response) => {
        executionOrder.push('res1')
        return response
      })
      client.interceptors.response.use((response) => {
        executionOrder.push('res2')
        return response
      })

      client.setConfig({ transport: realAxios() })
      await client({ method: 'GET', url: '/order' })

      // Axios executes request interceptors in LIFO order (req2 then req1) and response interceptors in FIFO order (res1 then res2)
      expect(executionOrder).toStrictEqual(['req2', 'req1', 'res1', 'res2'])
    })

    test('preserves interleaved response and error interceptor order across transport swap', async () => {
      const client = createClientCore()
      const calls: Array<string> = []

      // Register order: res1 -> err1 -> res2 (throws) -> err2
      client.interceptors.response.use((res) => {
        calls.push('res1')
        return res
      })
      client.interceptors.error.use((err) => {
        calls.push('err1')
        return err
      })
      client.interceptors.response.use(() => {
        calls.push('res2')
        throw new Error('boom from res2')
      })
      client.interceptors.error.use((err) => {
        calls.push('err2')
        return err
      })

      client.setConfig({ transport: realAxios() })

      await expect(client({ method: 'GET', url: '/interleaved' })).rejects.toThrow('boom from res2')

      // Because err1 was registered before res2, err1 does not see the error thrown by res2.
      // Only err2 (registered after res2) runs.
      expect(calls).toStrictEqual(['res1', 'res2', 'err2'])
    })

    test('preserves re-ordered position of updated interceptor across transport swap', async () => {
      const client = createClientCore()
      const calls: Array<string> = []

      const id1 = client.interceptors.response.use((res) => {
        calls.push('res1')
        return res
      })
      client.interceptors.response.use((res) => {
        calls.push('res2')
        return res
      })

      // Update id1 moves it to the end of the interceptor chain
      client.interceptors.response.update(id1, (res) => {
        calls.push('res1-updated')
        return res
      })

      client.setConfig({ transport: realAxios() })
      await client({ method: 'GET', url: '/update-order' })

      expect(calls).toStrictEqual(['res2', 'res1-updated'])
    })

    test('preserves re-ordered position of updated error interceptor across transport swap', async () => {
      const client = createClientCore()
      const calls: Array<string> = []

      // Register error first, then response
      const errId = client.interceptors.error.use((err) => {
        calls.push('err1')
        return err
      })
      client.interceptors.response.use(() => {
        calls.push('res1')
        throw new Error('boom from res1')
      })

      // Initially, err1 was registered before res1, so err1 does not catch res1 errors.
      // Now update errId: it moves to the end of the chain (after res1).
      client.interceptors.error.update(errId, (err) => {
        calls.push('err1-updated')
        return err
      })

      client.setConfig({ transport: realAxios() })
      await expect(client({ method: 'GET', url: '/error-update-order' })).rejects.toThrow('boom from res1')

      expect(calls).toStrictEqual(['res1', 'err1-updated'])
    })

    test('preserves LIFO re-ordered position of updated request interceptor across transport swap', async () => {
      const client = createClientCore()
      const calls: Array<string> = []

      const id1 = client.interceptors.request.use((config) => {
        calls.push('req1')
        return config
      })
      client.interceptors.request.use((config) => {
        calls.push('req2')
        return config
      })

      // In Axios, request interceptors are LIFO.
      // Updating id1 moves it to the end of Axios's chain, so it now executes first.
      client.interceptors.request.update(id1, (config) => {
        calls.push('req1-updated')
        return config
      })

      client.setConfig({ transport: realAxios() })
      await client({ method: 'GET', url: '/req-update-order' })

      expect(calls).toStrictEqual(['req1-updated', 'req2'])
    })

    test('safely handles update with unknown or previously ejected id after transport swap', async () => {
      const client = createClientCore()
      const reqFn = vi.fn((config: InternalAxiosRequestConfig) => config)
      const id = client.interceptors.request.use(reqFn)

      client.setConfig({ transport: realAxios() })

      const phantomFn = vi.fn((config: InternalAxiosRequestConfig) => config)
      expect(() => client.interceptors.request.update(9999, phantomFn)).not.toThrow()

      client.interceptors.request.eject(id)
      expect(() => client.interceptors.request.update(id, phantomFn)).not.toThrow()

      await client({ method: 'GET', url: '/test' })
      expect(reqFn).not.toHaveBeenCalled()
      expect(phantomFn).not.toHaveBeenCalled()
    })

    test('preserves pre-existing interceptors on incoming transport during swap', async () => {
      const customTransport = realAxios()
      const transportCalls: Array<string> = []
      customTransport.interceptors.request.use((config) => {
        transportCalls.push('transport-req')
        return config
      })
      customTransport.interceptors.response.use((response) => {
        transportCalls.push('transport-res')
        return response
      })

      const client = createClientCore()
      client.interceptors.request.use((config) => {
        transportCalls.push('client-req')
        return config
      })
      client.interceptors.response.use((response) => {
        transportCalls.push('client-res')
        return response
      })

      client.setConfig({ transport: customTransport })
      await client({ method: 'GET', url: '/test' })

      expect(transportCalls).toContain('transport-req')
      expect(transportCalls).toContain('client-req')
      expect(transportCalls).toContain('transport-res')
      expect(transportCalls).toContain('client-res')

      // Swapping again detaches client's interceptors from customTransport without removing customTransport's own interceptors
      client.setConfig({ transport: realAxios() })
      transportCalls.length = 0
      await customTransport.request({ url: '/direct' })
      expect(transportCalls).toStrictEqual(['transport-req', 'transport-res'])
    })

    test('ejects response and error interceptors by original id after transport swap', async () => {
      const client = createClientCore()
      const resFn = vi.fn((res: AxiosResponse) => res)
      const errFn = vi.fn((err: AxiosError) => err)

      const resId = client.interceptors.response.use(resFn)
      const errId = client.interceptors.error.use(errFn)

      client.setConfig({ transport: realAxios() })
      client.interceptors.response.eject(resId)
      client.interceptors.error.eject(errId)

      await client({ method: 'GET', url: '/ok' })
      expect(resFn).not.toHaveBeenCalled()

      client.setConfig({ transport: realAxios(500) })
      await expect(client({ method: 'GET', url: '/fail' })).rejects.toThrow()
      expect(errFn).not.toHaveBeenCalled()
    })

    test('allows error interceptor to return a transformed error on swapped transport', async () => {
      const client = createClientCore()
      const customError = new AxiosErrorClass('Custom transformed error', 'ERR_CUSTOM')
      client.interceptors.error.use(() => customError)

      client.setConfig({ transport: realAxios(500) })
      await expect(client({ method: 'GET', url: '/error' })).rejects.toThrow('Custom transformed error')
    })
  })

  test('createClient produces a new instance', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const child = client.createClient()
    expect(child).not.toBe(client)
  })
})

describe('header merging', () => {
  // Client defaults and call headers are merged into one set for every request, with or without a headers
  // validator. Header names are case-insensitive, so each header is sent once.
  async function send(clientHeaders: unknown, request: Record<string, unknown>) {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, headers: clientHeaders as ClientConfig['headers'] })
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

  test.each([undefined, null])('keeps the client value when the call sets the header to %s', async (value) => {
    const headers = await send({ 'X-Tenant': 'client' }, { headers: { 'X-Tenant': value } })
    expect(headers['X-Tenant']).toBe('client')
  })

  test('does not duplicate Content-Type when the client sets it in another casing', async () => {
    const headers = await send({ 'content-type': 'application/vnd.api+json' }, { body: { name: 'odie' } })
    expect(Object.keys(headers).filter((key) => key.toLowerCase() === 'content-type')).toStrictEqual(['content-type'])
    expect(headers['content-type']).toBe('application/vnd.api+json')
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

  test('encodes the path, query, and headers before they are serialized', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
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
    expect(calls[0]?.url).toBe('/events/2026-10-01')
    expect(calls[0]?.params).toStrictEqual({ after: '2026-09-01T09:00:00.000Z' })
    expect((calls[0]?.headers as Record<string, string>)['X-Since']).toBe('2026-08-01T00:00:00.000Z')
  })

  test('sends exactly what the query validator returns, so a key the schema drops stays dropped', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({
      method: 'GET',
      url: '/events',
      query: { after: new Date('2026-09-01T00:00:00.000Z'), page: 2 },
      validator: { query: encodeDates(['after']) },
    })
    expect(calls[0]?.params).toStrictEqual({ after: '2026-09-01T00:00:00.000Z' })
  })

  test('sends the undeclared headers a headers validator keeps', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    await client({
      method: 'GET',
      url: '/events',
      headers: { 'X-Since': new Date('2026-08-01T00:00:00.000Z'), 'X-Trace': 'abc' },
      validator: { headers: encodeDatesLoose(['X-Since']) },
    })
    expect(calls[0]?.headers as Record<string, unknown>).toMatchObject({ 'X-Since': '2026-08-01T00:00:00.000Z', 'X-Trace': 'abc' })
  })

  test('validates the client headers together with the call headers', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, headers: { 'X-Tenant': 'acme', Authorization: 'Bearer token' } })
    const headers = vi.fn((value: unknown) => value)
    await client({ method: 'GET', url: '/events', headers: { 'X-Trace': 'abc' }, validator: { headers: toSchema(headers) } })
    expect(headers).toHaveBeenCalledWith({ 'X-Tenant': 'acme', Authorization: 'Bearer token', 'X-Trace': 'abc' })
    expect(calls[0]?.headers as Record<string, unknown>).toMatchObject({ 'X-Tenant': 'acme', Authorization: 'Bearer token', 'X-Trace': 'abc' })
  })

  test('collapses every spelling of a header into one key, the call winning', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, headers: { 'x-tenant': 'client' } })
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
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance, onValidationError: () => ({ value: {} }) })
    await client({ method: 'GET', url: '/pets', query: { limit: 'invalid' }, validator: { query: toFailingSchema() } })
    expect(calls[0]?.params).toStrictEqual({})
  })

  test('validates an absent group as an empty object, so a missing required param still fails', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const query = vi.fn((value: unknown) => value)
    await expect(client({ method: 'GET', url: '/events/{day}', validator: { path: toFailingSchema() } })).rejects.toMatchObject({ name: 'ParseError' })
    await client({ method: 'GET', url: '/events', validator: { query: toSchema(query) } })
    expect(query).toHaveBeenCalledWith({})
    expect(calls).toHaveLength(1)
  })

  test('adds apiKey query auth after the query is validated, so it never reaches the schema', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ transport: instance })
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
    expect(calls[0]?.params).toStrictEqual({ page: 1, api_key: 'secret' })
  })

  test('reports a failing param with the request direction and its source', async () => {
    const { instance } = fakeAxios()
    const onValidationError = vi.fn(() => ({ value: { page: 1 } }))
    const client = createClientCore({ transport: instance, onValidationError })
    await client({ method: 'GET', url: '/events', query: { page: 'x' }, validator: { query: toFailingSchema() } })
    expect(onValidationError.mock.calls[0]?.[1]).toMatchObject({ direction: 'request', source: 'query', method: 'GET', url: '/events', value: { page: 'x' } })
  })

  test('getUrl serializes the params as passed, without running the validators', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    const path = vi.fn((value: unknown) => value)
    // @ts-expect-error getUrl takes no validator: it serializes the params as passed
    expect(client.getUrl({ url: '/events/{day}', path: { day: '2026-10-01' }, validator: { path: toSchema(path) } })).toBe('/events/2026-10-01')
    expect(path).not.toHaveBeenCalled()
  })
})

describe('content type negotiation', () => {
  function fakeAxiosWith(result: Programmed & { contentType?: string }) {
    const calls: Array<AxiosRequestConfig> = []
    const request = vi.fn(async (config: AxiosRequestConfig) => {
      calls.push(config)
      const status = result.status ?? 200
      const response = {
        data: result.data ?? { ok: true },
        status,
        statusText: result.statusText ?? 'OK',
        headers: result.contentType ? { 'content-type': result.contentType } : {},
        config,
      } as unknown as AxiosResponse
      const validate = config.validateStatus ?? ((s: number) => s >= 200 && s < 300)
      if (!validate(status)) {
        throw Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, name: 'AxiosError', config, response }) as AxiosError
      }
      return response
    })
    const instance = {
      request,
      interceptors: { request: { use: vi.fn(() => 1), eject: vi.fn() }, response: { use: vi.fn(() => 2), eject: vi.fn() } },
    } as unknown as AxiosInstance
    return { instance, calls }
  }

  test('object-form contentType sets the request Content-Type and the Accept header', async () => {
    const { instance, calls } = fakeAxiosWith({})
    const client = createClientCore({ transport: instance })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: { request: 'application/json', response: 'application/xml' } })
    expect(calls[0]?.headers?.['Content-Type']).toBe('application/json')
    expect(calls[0]?.headers?.['Accept']).toBe('application/xml')
  })

  test('does not override a caller-set Accept header', async () => {
    const { instance, calls } = fakeAxiosWith({})
    const client = createClientCore({ transport: instance })
    await client({ method: 'GET', url: '/pet', headers: { Accept: 'application/json' }, contentType: { response: 'application/xml' } })
    expect(calls[0]?.headers?.['Accept']).toBe('application/json')
  })

  test('carries the negotiated content type onto result.contentType, charset stripped', async () => {
    const { instance } = fakeAxiosWith({ data: { id: 1 }, contentType: 'application/xml; charset=utf-8' })
    const client = createClientCore({ transport: instance })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult<AxiosRequestConfig, AxiosResponse>
    expect(result.contentType).toBe('application/xml')
    expect(result.data).toStrictEqual({ id: 1 })
  })

  test('runs the matching deserializer before validation and feeds result.data', async () => {
    const { instance } = fakeAxiosWith({ data: '<pet><id>1</id></pet>', contentType: 'application/xml' })
    const parseXml = vi.fn(() => ({ id: 1 }))
    const client = createClientCore({ transport: instance, codecs: { 'application/xml': { deserialize: parseXml } } })
    const result = (await client({ method: 'GET', url: '/pet/1' })) as CallResult<AxiosRequestConfig, AxiosResponse>
    expect(parseXml).toHaveBeenCalledWith('<pet><id>1</id></pet>', 'application/xml')
    expect(result.data).toStrictEqual({ id: 1 })
    expect(result.contentType).toBe('application/xml')
  })

  test('uses a per-content-type bodySerializer for the request body', async () => {
    const { instance, calls } = fakeAxiosWith({})
    const toXml = vi.fn(() => '<pet/>')
    const client = createClientCore({ transport: instance, codecs: { 'application/xml': { serialize: toXml } } })
    await client({ method: 'POST', url: '/pet', body: { name: 'odie' }, contentType: 'application/xml' })
    expect(toXml).toHaveBeenCalledWith({ name: 'odie' }, 'application/xml')
    expect(calls[0]?.data).toBe('<pet/>')
  })

  test('carries the negotiated content type onto a thrown ResponseError', async () => {
    const { instance } = fakeAxiosWith({ data: { message: 'bad' }, status: 422, contentType: 'application/xml' })
    const client = createClientCore({ transport: instance })
    await expect(client({ method: 'POST', url: '/pet' })).rejects.toMatchObject({ status: 422, contentType: 'application/xml' })
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

  test('a per-call baseURL replaces the configured baseURL', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance, baseURL: 'https://example.com' })
    expect(client.getUrl({ baseURL: 'https://override.test', url: '/pet' })).toBe('https://override.test/pet')
  })

  test('prefixes a per-call baseURL', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ baseURL: 'https://example.com', url: '/pet' })).toBe('https://example.com/pet')
  })

  test('uses a per-call query serializer override', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pet', query: { a: 1 }, serializer: { query: () => 'custom=1' } })).toBe('/pet?custom=1')
  })

  test('uses a per-call path serializer override', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, serializer: { path: ({ value }) => `id-${value as string}` } })).toBe('/pet/id-7')
  })

  test('applies styles.path metadata to the matching placeholders', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 7 }, styles: { path: { petId: { style: 'matrix' } } } })).toBe('/pet/;petId=7')
  })

  test('applies styles.query metadata to the query string', () => {
    const { instance } = fakeAxios()
    const client = createClientCore({ transport: instance })
    expect(client.getUrl({ url: '/pets', query: { id: [3, 4, 5] }, styles: { query: { id: { style: 'pipeDelimited', explode: false } } } })).toBe(
      '/pets?id=3|4|5',
    )
  })
})

describe('unwrapResult', () => {
  test('narrows a success result to its data', async () => {
    const result = await unwrapResult(Promise.resolve({ data: { id: 1 }, error: undefined }), undefined)
    expect(result).toStrictEqual({ id: 1 })
  })

  test('falls back to the full result when throwOnError is false', async () => {
    const full = { data: undefined, error: { message: 'not found' } }
    const result = await unwrapResult(Promise.resolve(full), false)
    expect(result).toBe(full)
  })
})

describe('withUnwrap', () => {
  test('unwrap() resolves to the success data', async () => {
    const result = await withUnwrap(Promise.resolve({ data: { id: 1 }, error: undefined })).unwrap()
    expect(result).toStrictEqual({ id: 1 })
  })

  test('unwrap() rejects with error for a non-throwing error result', async () => {
    await expect(withUnwrap(Promise.resolve({ data: undefined, error: { message: 'not found' } })).unwrap()).rejects.toStrictEqual({
      message: 'not found',
    })
  })

  test('a rejected call propagates the rejection unchanged', async () => {
    const error = new ResponseError({ data: { message: 'not found' }, status: 404, statusText: 'Not Found', request: {}, response: {} })
    await expect(withUnwrap(Promise.reject(error)).unwrap()).rejects.toBe(error)
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

  test('concatenates multi-line data and reads event/id/retry fields', async () => {
    const events = await collect(parseEventStream(streamOf(['event: ping\nid: 42\nretry: 3000\ndata: line one\ndata: line two\n\n'])))
    expect(events).toStrictEqual([{ event: 'ping', id: '42', retry: 3000, data: 'line one\nline two' }])
  })

  test('ignores comment lines and keeps non-JSON data as a string', async () => {
    const events = await collect(parseEventStream<string>(streamOf([': keep-alive\n\n', 'data: hello world\n\n'])))
    expect(events).toStrictEqual([{ data: 'hello world' }])
  })

  test('normalizes CRLF endings and flushes a trailing event', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"n":1}\r\n\r\ndata: {"n":2}\r\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }, { data: { n: 2 } }])
  })

  test('consumes an async iterable of byte chunks, as the axios stream response yields', async () => {
    const events = await collect(parseEventStream(asyncIterableOf(['data: {"n":1}\n\n'])))
    expect(events).toStrictEqual([{ data: { n: 1 } }])
  })
})
