import http from 'node:http'
import { Readable } from 'node:stream'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { axiosInstance, client, createAxiosTransport, createClient, createClientCore, ResponseError } from './client.ts'

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

afterEach(() => vi.unstubAllGlobals())

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

  test('reads a bodiless status as no data, as the fetch transport does, and keeps an empty 200 body', async () => {
    const none = createClientCore({ defaultTransport: fakeAxios({ data: '', status: 204, statusText: 'No Content' }).transport })
    const empty = createClientCore({ defaultTransport: fakeAxios({ data: '', headers: { 'content-type': 'text/plain' } }).transport })

    const emptyJson = createClientCore({ defaultTransport: fakeAxios({ data: '', headers: { 'content-type': 'application/json' } }).transport })

    expect(await none({ method: 'DELETE', url: '/pet/1' })).toMatchObject({ status: 204, data: undefined, error: undefined })
    expect(await empty({ method: 'GET', url: '/pet/1' })).toMatchObject({ status: 200, data: '' })
    expect(await emptyJson({ method: 'GET', url: '/pet/1' })).toMatchObject({ status: 200, data: undefined })
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

  test('maps credentials onto the request the fetch adapter sends, over withCredentials in the defaults or the options', async () => {
    const sent: Array<RequestCredentials> = []
    const fetch = async (input: Request) => (sent.push(input.credentials), new Response('{}', { headers: { 'content-type': 'application/json' } }))
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'fetch', env: { fetch }, withCredentials: true })) })
    const url = 'https://petstore.dev/pet'

    for (const credentials of ['include', 'omit', 'same-origin'] as const) await client({ method: 'GET', url, credentials })
    await client({ method: 'GET', url, credentials: 'same-origin', options: { withCredentials: true } })
    await client({ method: 'GET', url })

    expect(sent).toStrictEqual(['include', 'omit', 'same-origin', 'same-origin', 'include'])
  })

  test('passes credentials as is when an adapter list resolves to fetch', async () => {
    const sent: Array<RequestCredentials> = []
    const fetch = async (input: Request) => (sent.push(input.credentials), new Response('{}', { headers: { 'content-type': 'application/json' } }))
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: ['fetch', 'xhr'], env: { fetch } })) })

    await client({ method: 'GET', url: 'https://petstore.dev/pet', credentials: 'same-origin' })

    expect(sent).toStrictEqual(['same-origin'])
  })

  test('maps credentials onto withCredentials for the other adapters, and sends omit through fetch in the browser', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport })

    await client({ method: 'GET', url: '/pet', credentials: 'include' })
    await client({ method: 'GET', url: '/pet', credentials: 'same-origin', options: { withCredentials: true } })
    await client({ method: 'GET', url: '/pet', credentials: 'omit' })
    vi.stubGlobal('XMLHttpRequest', class {})
    await client({ method: 'GET', url: '/pet', credentials: 'omit' })
    await client({ method: 'GET', url: '/pet', credentials: 'omit', options: { adapter: 'xhr' } })

    expect(calls.map(({ adapter, withCredentials }) => ({ adapter, withCredentials }))).toStrictEqual([
      { adapter: undefined, withCredentials: true },
      { adapter: undefined, withCredentials: false },
      { adapter: undefined, withCredentials: false },
      { adapter: 'fetch', withCredentials: 'omit' },
      { adapter: 'xhr', withCredentials: false },
    ])
  })

  test('sends no Content-Type on a call without a body, where axios would label a patch as a form', async () => {
    const sent: Array<string | null> = []
    const fetch = async (input: Request) => (sent.push(input.headers.get('content-type')), new Response(null, { status: 204 }))
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'fetch', env: { fetch } })) })

    await client({ method: 'PATCH', url: 'https://petstore.dev/pet/1' })
    await client({ method: 'PATCH', url: 'https://petstore.dev/pet/1', body: { name: 'odie' }, contentType: 'application/merge-patch+json' })

    expect(sent).toStrictEqual([null, 'application/merge-patch+json'])
  })

  test('sends a typed array and a Blob through the Node adapter with the operation content type', async () => {
    const seen: Array<{ type: string | undefined; body: string }> = []
    const server = http.createServer((req, res) => {
      const chunks: Array<Buffer> = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => (seen.push({ type: req.headers['content-type'], body: Buffer.concat(chunks).toString('hex') }), res.end()))
    })
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const url = `http://localhost:${(server.address() as { port: number }).port}/upload`
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'http' })) })

    try {
      await client({ method: 'PUT', url, body: new Uint8Array([9, 0, 1, 2]).subarray(1), contentType: 'application/octet-stream' })
      await client({ method: 'PUT', url, body: new Blob([new Uint8Array([3])], { type: 'image/png' }), contentType: 'application/octet-stream' })
    } finally {
      server.close()
    }

    expect(seen).toStrictEqual([
      { type: 'application/octet-stream', body: '000102' },
      { type: 'application/octet-stream', body: '03' },
    ])
  })

  test('decodes a body by its Content-Type when no response type is set, as the fetch transport does', async () => {
    const bodies: Record<string, [string, string]> = {
      '/text': ['{"id":1}', 'text/plain'],
      '/json': ['{"id":1}', 'application/json'],
      '/number': ['123', 'text/plain'],
    }
    const fetch = async (input: Request) => {
      const [body, type] = bodies[new URL(input.url).pathname]!
      return new Response(body, { headers: { 'content-type': type } })
    }
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'fetch', env: { fetch } })) })

    expect((await client({ method: 'GET', url: 'https://petstore.dev/text' })).data).toBe('{"id":1}')
    expect((await client({ method: 'GET', url: 'https://petstore.dev/json' })).data).toStrictEqual({ id: 1 })
    expect((await client({ method: 'GET', url: 'https://petstore.dev/number' })).data).toBe('123')
  })

  test('rejects an aborted call with the signal reason, as fetch does', async () => {
    const reason = new Error('stop')
    const fetch = async () => new Response('{}', { headers: { 'content-type': 'application/json' } })
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'fetch', env: { fetch } })) })

    await expect(client({ method: 'GET', url: 'https://petstore.dev/pet', signal: AbortSignal.abort(reason) })).rejects.toBe(reason)
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

  test('passes the signal and the response type, and streams through the fetch adapter in the browser unless one is set', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport })
    const controller = new AbortController()
    vi.stubGlobal('XMLHttpRequest', class {})

    await client({ method: 'GET', url: '/events', responseType: 'stream', signal: controller.signal })
    await client({ method: 'GET', url: '/events', responseType: 'stream', options: { adapter: 'xhr' } })
    await client({ method: 'GET', url: '/pet', responseType: 'blob' })
    vi.unstubAllGlobals()

    expect(calls[0]).toMatchObject({ responseType: 'stream', adapter: 'fetch', signal: controller.signal })
    expect(calls[1]?.adapter).toBe('xhr')
    expect(calls[2]).toMatchObject({ responseType: 'blob' })
    expect(calls[2]?.adapter).toBeUndefined()
  })

  test('reads a blob as a buffer on the Node adapter and wraps it, and keeps blob on the fetch adapter and in the browser', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const { calls, transport } = fakeAxios({ data: png, headers: { 'content-type': 'image/png' } })
    const client = createClientCore({ defaultTransport: transport })

    const node = await client({ method: 'GET', url: '/image', responseType: 'blob' })
    await client({ method: 'GET', url: '/image', responseType: 'blob', options: { adapter: 'fetch' } })
    vi.stubGlobal('XMLHttpRequest', class {})
    await client({ method: 'GET', url: '/image', responseType: 'blob' })

    expect(calls.map((call) => call.responseType)).toStrictEqual(['arraybuffer', 'blob', 'blob'])
    expect(node.data).toBeInstanceOf(Blob)
    expect((node.data as Blob).type).toBe('image/png')
    expect(new Uint8Array(await (node.data as Blob).arrayBuffer())).toStrictEqual(new Uint8Array(png))
  })

  test('keeps a text-mode error body as text, as the fetch transport does', async () => {
    const { transport } = fakeAxios({ data: '404', status: 404, headers: { 'content-type': 'application/json' } })
    const client = createClientCore({ defaultTransport: transport, throwOnError: false })

    expect((await client({ method: 'GET', url: '/pet', responseType: 'text' })).error).toBe('404')
  })

  test('keeps a failed blob call whose content type the runtime does not know as a Blob, as the fetch transport does', async () => {
    const { transport } = fakeAxios({ data: Buffer.from([1, 2, 3]), status: 500, headers: { 'content-type': 'application/vnd.custom' } })
    const client = createClientCore({ defaultTransport: transport, throwOnError: false })

    const { error } = await client({ method: 'GET', url: '/image', responseType: 'blob' })
    expect(error).toBeInstanceOf(Blob)
    expect(new Uint8Array(await (error as Blob).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  test('decodes the error body of a blob call on every adapter, instead of returning bytes', async () => {
    const body = Buffer.from('{"message":"gone"}')
    const { transport } = fakeAxios({ data: body, status: 404, headers: { 'content-type': 'application/json' } })
    const client = createClientCore({ defaultTransport: transport, throwOnError: false })

    expect((await client({ method: 'GET', url: '/image', responseType: 'blob' })).error).toStrictEqual({ message: 'gone' })
    const { transport: fetchTransport } = fakeAxios({ data: new Blob([body]), status: 404, headers: { 'content-type': 'application/json' } })
    const fetchClient = createClientCore({ defaultTransport: fetchTransport, throwOnError: false })
    expect((await fetchClient({ method: 'GET', url: '/image', responseType: 'blob', options: { adapter: 'fetch' } })).error).toStrictEqual({ message: 'gone' })
  })

  test('keeps the instance adapter for a stream, and the Node adapter outside the browser', async () => {
    const seen: Array<unknown> = []
    const adapter = async (config: InternalAxiosRequestConfig) =>
      (seen.push(config.adapter), { data: {}, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse
    const custom = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter })) })
    const { calls, transport } = fakeAxios()
    const node = createClientCore({ defaultTransport: transport })
    vi.stubGlobal('XMLHttpRequest', class {})

    await custom({ method: 'GET', url: '/events', responseType: 'stream' })
    vi.unstubAllGlobals()
    await node({ method: 'GET', url: '/events', responseType: 'stream' })

    expect(seen).toStrictEqual([adapter])
    expect(calls[0]?.adapter).toBeUndefined()
  })

  test('rethrows a network error from axios', async () => {
    const networkError = Object.assign(new Error('Network Error'), { isAxiosError: true, name: 'AxiosError' })
    const instance = { request: vi.fn(async () => Promise.reject(networkError)) } as unknown as AxiosInstance
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })

    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBe(networkError)
  })

  test('runs client.interceptors next to the axios interceptors of the wrapped instance', async () => {
    const instance = realAxios()
    instance.interceptors.request.use((config) => {
      config.headers.set('X-Axios', 'yes')
      return config
    })
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })
    const seen: Array<string> = []
    client.interceptors.request.use((request) => (seen.push(`request ${request.headers['X-Kubb']}`), request))
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

describe('a responseType map', () => {
  const audio = new Uint8Array([0xff, 0xfb, 0x90, 0x00])
  const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).buffer
  /** A real axios instance, so `transformResponse` and the axios interceptors run, answering with the given body. */
  const answering = ({ status = 200, body, contentType }: { status?: number; body: unknown; contentType: string }) => {
    const seen: Array<InternalAxiosRequestConfig> = []
    const instance = axios.create({
      adapter: async (config: InternalAxiosRequestConfig) => {
        seen.push(config)
        return { data: body, status, statusText: 'x', headers: { 'content-type': contentType }, config } as AxiosResponse
      },
    })
    return { instance, seen, client: createClientCore({ defaultTransport: createAxiosTransport(instance) }) }
  }

  test('reads bytes and decodes the matching content type to a Blob with its media type', async () => {
    const { client, seen } = answering({ body: audio.buffer, contentType: 'audio/mpeg' })
    const result = await client({ method: 'POST', url: '/speech', responseType: { 'audio/mpeg': 'blob', 'application/json': 'json' } })

    expect(seen[0]?.responseType).toBe('arraybuffer')
    expect(result.data).toBeInstanceOf(Blob)
    expect((result.data as Blob).type).toBe('audio/mpeg')
    expect(new Uint8Array(await (result.data as Blob).arrayBuffer())).toEqual(audio)
  })

  test('matches a type wildcard', async () => {
    const { client } = answering({ body: audio.buffer, contentType: 'audio/wav' })
    const result = await client({ method: 'POST', url: '/speech', responseType: { 'audio/*': 'blob', 'application/json': 'json' } })
    expect(result.data).toBeInstanceOf(Blob)
  })

  test('hands the axios response interceptors the parsed JSON body', async () => {
    const { client, instance } = answering({ body: json({ delta: 'hi' }), contentType: 'application/json' })
    const intercepted: Array<unknown> = []
    instance.interceptors.response.use((response) => (intercepted.push(response.data), response))

    const result = await client({ method: 'POST', url: '/speech', responseType: { 'audio/mpeg': 'blob', 'application/json': 'json' } })

    expect(intercepted).toStrictEqual([{ delta: 'hi' }])
    expect(result.data).toStrictEqual({ delta: 'hi' })
  })

  test('reads a stream when the map has a stream entry, and keeps an event stream as a stream', async () => {
    const responseType = { 'audio/mpeg': 'blob', 'text/event-stream': 'stream' } as const
    const events = answering({ body: new Blob(['data: hi\n\n']).stream(), contentType: 'text/event-stream' })
    const result = await events.client({ method: 'POST', url: '/speech', responseType })

    expect(events.seen[0]?.responseType).toBe('stream')
    expect(result.data).toBeInstanceOf(ReadableStream)

    const speech = answering({ body: new Blob([audio]).stream(), contentType: 'audio/mpeg' })
    const blob = (await speech.client({ method: 'POST', url: '/speech', responseType })).data as Blob
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(audio)
  })

  test('decodes a mapped error body into ResponseError.data', async () => {
    const { client } = answering({ status: 400, body: json({ message: 'bad' }), contentType: 'application/json' })
    await expect(client({ method: 'POST', url: '/speech', responseType: { 'audio/mpeg': 'blob' } })).rejects.toMatchObject({
      name: 'ResponseError',
      status: 400,
      data: { message: 'bad' },
    })
  })
})

describe('client', () => {
  test('sends through axiosInstance, and through a transport set on the client, a call, or a child', async () => {
    const seen: Array<string> = []
    const transport = (name: string) =>
      createAxiosTransport(
        axios.create({
          adapter: async (config: InternalAxiosRequestConfig) =>
            (seen.push(name), { data: {}, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse,
        }),
      )
    using _request = vi
      .spyOn(axiosInstance, 'request')
      .mockImplementation(async (config) => (seen.push('default'), { data: {}, status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse)

    await client({ method: 'GET', url: '/pet' })
    await client({ method: 'GET', url: '/pet', transport: transport('call') })
    const child = createClient({ transport: transport('child') })
    await child({ method: 'GET', url: '/pet' })
    child.setConfig({ transport: transport('swapped') })
    await child({ method: 'GET', url: '/pet' })

    expect(seen).toStrictEqual(['default', 'call', 'child', 'swapped'])
  })

  test('runs client.interceptors on the resolved request, the result, and the ResponseError', async () => {
    const own = createClient()
    const seen: Array<string> = []
    const requestId = own.interceptors.request.use((request) => (seen.push(`request ${request.headers['X-Kubb']}`), request))
    own.interceptors.response.use((result) => (seen.push(`response ${result.status}`), result))
    own.interceptors.error.use((error) => (seen.push(`error ${error.status}`), error))
    const adapter = async (config: InternalAxiosRequestConfig) =>
      ({ data: {}, status: config.url === '/fail' ? 500 : 200, statusText: 'x', headers: {}, config }) as AxiosResponse

    await own({ method: 'GET', url: '/pet', headers: { 'X-Kubb': 'a' }, options: { adapter } })
    own.interceptors.request.update(requestId, (request) => (seen.push('updated'), request))
    await own({ method: 'GET', url: '/pet', options: { adapter } })
    own.interceptors.request.eject(requestId)
    await expect(own({ method: 'GET', url: '/fail', options: { adapter } })).rejects.toBeInstanceOf(ResponseError)

    expect(seen).toStrictEqual(['request a', 'response 200', 'updated', 'response 200', 'response 500', 'error 500'])
  })
})
