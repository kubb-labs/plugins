import { Readable } from 'node:stream'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { describe, expect, test, vi } from 'vitest'
import { client, createAxiosTransport, createClient, createClientCore, defaultTransport, ResponseError } from './client.ts'

type Programmed = { data?: unknown; status?: number; statusText?: string; headers?: Record<string, unknown> }

/**
 * An axios instance stub that records each request config and answers with the programmed response. It never throws
 * on a status, as a real instance with `validateStatus: () => true` does not.
 */
function fakeAxios(result: Programmed = {}) {
  const calls: Array<AxiosRequestConfig> = []
  const request = vi.fn(async (config: AxiosRequestConfig) => {
    calls.push(config)
    return {
      data: result.data ?? { ok: true },
      status: result.status ?? 200,
      statusText: result.statusText ?? 'OK',
      headers: result.headers ?? {},
      config,
    } as unknown as AxiosResponse
  })
  const instance = { request } as unknown as AxiosInstance
  return { instance, calls, request, transport: createAxiosTransport(instance) }
}

/** A real axios instance whose adapter answers `{ ok: true }`, so the instance's own interceptors and defaults run. */
function realAxios() {
  return axios.create({
    adapter: async (config: InternalAxiosRequestConfig) =>
      ({ data: { ok: true }, status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config }) as AxiosResponse,
  })
}

describe('createAxiosTransport', () => {
  test('sends the resolved request as one axios request and returns its response', async () => {
    const { calls, transport } = fakeAxios({ data: { id: 1 }, headers: { 'content-type': 'application/json; charset=utf-8', 'x-count': 2 } })
    const client = createClientCore({ defaultTransport: transport })

    const result = await client({ method: 'GET', url: '/pet/{petId}', path: { petId: 7 }, query: { sort: 'name' }, headers: { 'X-Call': 'a' } })

    expect(calls[0]).toMatchObject({ url: '/pet/7?sort=name', method: 'GET', headers: { 'X-Call': 'a' } })
    expect(result).toMatchObject({ status: 200, data: { id: 1 }, error: undefined, contentType: 'application/json' })
    expect(result.request).toBe(calls[0])
    expect((result.response as AxiosResponse).headers).toMatchObject({ 'x-count': 2 })
  })

  test('resolves every status so the core splits success from error', async () => {
    const { calls, transport } = fakeAxios({ data: { message: 'invalid' }, status: 405 })
    const client = createClientCore({ defaultTransport: transport })

    const result = await client({ method: 'GET', url: '/pet', throwOnError: false })
    expect(result).toMatchObject({ status: 405, error: { message: 'invalid' }, data: undefined })
    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBeInstanceOf(ResponseError)
    expect(calls.every((call) => call.validateStatus?.(500))).toBe(true)
  })

  test('spreads the call options under the runtime-owned fields', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport, options: { timeout: 1000 } })

    await client({ method: 'GET', url: '/pet', options: { timeout: 5, validateStatus: () => false, url: '/other' } })

    expect(calls[0]).toMatchObject({ timeout: 5, url: '/pet' })
    expect(calls[0]?.validateStatus?.(500)).toBe(true)
  })

  test('sends the serialized body and turns URLSearchParams into a string for the Node adapter', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport })

    await client({ method: 'POST', url: '/pet', body: { name: 'odie' } })
    await client({ method: 'POST', url: '/pet', body: { foo: 'a b' }, contentType: 'application/x-www-form-urlencoded' })

    expect(calls[0]).toMatchObject({ data: '{"name":"odie"}', headers: { 'Content-Type': 'application/json' } })
    const transform = calls[1]?.transformRequest as (data: unknown) => unknown
    expect(transform(calls[1]?.data)).toBe('foo=a+b')
    expect(transform('kept')).toBe('kept')
  })

  test('passes the signal and the response type, and streams through the fetch adapter unless one is set', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport })
    const controller = new AbortController()

    await client({ method: 'GET', url: '/events', responseType: 'stream', signal: controller.signal })
    await client({ method: 'GET', url: '/events', responseType: 'stream', options: { adapter: 'xhr' } })
    await client({ method: 'GET', url: '/pet', responseType: 'blob' })

    expect(calls[0]).toMatchObject({ responseType: 'stream', adapter: 'fetch', signal: controller.signal })
    expect(calls[1]?.adapter).toBe('xhr')
    expect(calls[2]).toMatchObject({ responseType: 'blob' })
    expect(calls[2]?.adapter).toBeUndefined()
  })

  test('rethrows a network error from axios', async () => {
    const networkError = Object.assign(new Error('Network Error'), { isAxiosError: true, name: 'AxiosError' })
    const instance = { request: vi.fn(async () => Promise.reject(networkError)) } as unknown as AxiosInstance
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })

    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBe(networkError)
  })

  test('runs the axios interceptors of the instance inside the kubb interceptors', async () => {
    const instance = realAxios()
    instance.interceptors.request.use((config) => {
      config.headers.set('X-Axios', 'yes')
      return config
    })
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })
    const seen: Array<string> = []
    client.interceptors.request.use((request) => (seen.push(`request ${request.headers['X-Kubb'] ?? ''}`), request))
    client.interceptors.response.use((result) => (seen.push(`response ${result.status}`), result))

    const result = await client({ method: 'GET', url: '/pet', headers: { 'X-Kubb': 'yes' } })

    expect((result.response as AxiosResponse).config.headers.get('X-Axios')).toBe('yes')
    expect(seen).toStrictEqual(['request yes', 'response 200'])
  })

  describe('a streamed call answered without an event stream', () => {
    const encoder = new TextEncoder()
    const streamOf = (text: string) => new ReadableStream<Uint8Array>({ start: (controller) => (controller.enqueue(encoder.encode(text)), controller.close()) })
    // The adapter goes on the call, since a stream request without its own adapter switches to the fetch adapter.
    const answering =
      ({ status = 200, body, contentType }: { status?: number; body: unknown; contentType: string }) =>
      async (config: InternalAxiosRequestConfig) =>
        ({ data: body, status, statusText: 'x', headers: { 'content-type': contentType }, config }) as AxiosResponse
    const streaming = (status: number, text: string, contentType: string) =>
      createClientCore({
        defaultTransport: createAxiosTransport(axios.create()),
        options: { adapter: answering({ status, body: streamOf(text), contentType }) },
      })

    test('reads a JSON body back into its value and keeps an event stream as a stream', async () => {
      const json = await streaming(200, '{"ok":true}', 'application/json')({ method: 'GET', url: '/events', responseType: 'stream' })
      expect(json.data).toStrictEqual({ ok: true })

      const problem = await streaming(200, '{"ok":true}', 'application/problem+json')({ method: 'GET', url: '/events', responseType: 'stream' })
      expect(problem.data).toStrictEqual({ ok: true })

      const events = await streaming(200, 'data: a\n\n', 'text/event-stream')({ method: 'GET', url: '/events', responseType: 'stream' })
      expect(events.data).toBeInstanceOf(ReadableStream)

      const ndjson = await streaming(200, '{"a":1}\n{"a":2}\n', 'application/x-ndjson')({ method: 'GET', url: '/events', responseType: 'stream' })
      expect(ndjson.data).toBeInstanceOf(ReadableStream)
    })

    test('reads a JSON body the Node adapter streams as a readable', async () => {
      const client = createClientCore({
        defaultTransport: createAxiosTransport(axios.create()),
        options: { adapter: answering({ body: Readable.from([Buffer.from('{"ok":true}')]), contentType: 'application/json' }) },
      })

      const result = await client({ method: 'GET', url: '/events', responseType: 'stream' })

      expect(result.data).toStrictEqual({ ok: true })
    })

    test('runs the response validator on a JSON body and throws a ResponseError with a parsed error body', async () => {
      const validator = { response: { '~standard': { validate: () => ({ value: 'validated' }) } } }
      const ok = await streaming(200, '{"ok":true}', 'application/json')({ method: 'GET', url: '/events', responseType: 'stream', validator })
      expect(ok.data).toBe('validated')

      await expect(streaming(404, '{"message":"gone"}', 'application/json')({ method: 'GET', url: '/events', responseType: 'stream' })).rejects.toMatchObject({
        name: 'ResponseError',
        status: 404,
        data: { message: 'gone' },
      })
      await expect(streaming(503, 'busy', 'text/plain')({ method: 'GET', url: '/events', responseType: 'stream' })).rejects.toMatchObject({
        name: 'ResponseError',
        status: 503,
        data: 'busy',
      })
    })
  })
})

describe('client', () => {
  test('sends through defaultTransport, an axios instance, and accepts an instance as transport on the client, a call, and a child', async () => {
    const seen: Array<string> = []
    const instance = (name: string) =>
      axios.create({
        adapter: async (config: InternalAxiosRequestConfig) =>
          (seen.push(name), { data: {}, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse,
      })
    using _request = vi
      .spyOn(defaultTransport, 'request')
      .mockImplementation(async (config) => (seen.push('default'), { data: {}, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse)

    await client({ method: 'GET', url: '/pet' })
    await client({ method: 'GET', url: '/pet', transport: instance('call') })
    const child = createClient({ transport: instance('child') })
    await child({ method: 'GET', url: '/pet' })
    child.setConfig({ transport: instance('swapped') })
    await child({ method: 'GET', url: '/pet' })

    expect(seen).toStrictEqual(['default', 'call', 'child', 'swapped'])
    expect(typeof child.getConfig().transport).toBe('function')
  })

  test('registers client.interceptors on the default instance as native axios handlers and keeps ids across update', async () => {
    const own = createClient()
    const seen: Array<string> = []
    const requestId = own.interceptors.request.use((config) => (seen.push(`request ${config.headers.get('X-Kubb')}`), config))
    own.interceptors.response.use((response) => (seen.push(`response ${response.status}`), response))
    own.interceptors.error.use((error) => (seen.push(`error ${error.response?.status}`), error))
    const adapter = async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/fail')
        throw new axios.AxiosError('fail', 'ERR_BAD_REQUEST', config, undefined, {
          data: {},
          status: 500,
          statusText: 'x',
          headers: {},
          config,
        } as AxiosResponse)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
    }

    await own({ method: 'GET', url: '/pet', headers: { 'X-Kubb': 'a' }, options: { adapter } })
    own.interceptors.request.update(requestId, (config) => (seen.push('updated'), config))
    await own({ method: 'GET', url: '/pet', options: { adapter } })
    own.interceptors.request.eject(requestId)
    await expect(own({ method: 'GET', url: '/fail', options: { adapter } })).rejects.toThrow('fail')

    expect(seen).toStrictEqual(['request a', 'response 200', 'updated', 'response 200', 'error 500'])
  })

  test('a child client has its own instance, so its interceptors do not reach the parent', async () => {
    const parent = createClient()
    const child = parent.createClient()
    const seen: Array<string> = []
    child.interceptors.request.use((config) => (seen.push('child'), config))
    const adapter = async (config: InternalAxiosRequestConfig) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse

    await parent({ method: 'GET', url: '/pet', options: { adapter } })
    await child({ method: 'GET', url: '/pet', options: { adapter } })

    expect(seen).toStrictEqual(['child'])
  })

  test('accepts the deprecated validateStatus without changing the status split', async () => {
    const own = createClient({ validateStatus: () => false })
    const adapter = async (config: InternalAxiosRequestConfig) => ({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse

    expect((await own({ method: 'GET', url: '/pet', options: { adapter } })).data).toStrictEqual({ ok: true })
  })
})
