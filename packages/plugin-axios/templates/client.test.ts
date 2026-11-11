import http from 'node:http'
import { Readable } from 'node:stream'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { multipartFormData } from '../../plugin-client/templates/mediaTypes/formData.ts'
import { multipartMixed } from '../../plugin-client/templates/mediaTypes/mixed.ts'
import { urlencoded } from '../../plugin-client/templates/mediaTypes/urlencoded.ts'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'
import { serializeCookies } from '../../plugin-client/templates/serializers/cookies.ts'
import { serializeHeaders } from '../../plugin-client/templates/serializers/headers.ts'
import { serializeStyledPath } from '../../plugin-client/templates/serializers/pathStyles.ts'
import { serializeStyledQuery } from '../../plugin-client/templates/serializers/queryStyles.ts'
import { client, createAxiosTransport, createClient, createClientCore as createCore, getAxiosInstance, ResponseError } from './client.ts'
import type { NativeRequest, NativeResponse } from './client.ts'

const formMediaTypes = { 'multipart/form-data': multipartFormData, 'multipart/mixed': multipartMixed, 'application/x-www-form-urlencoded': urlencoded }

const serializers = { query: serializeStyledQuery, path: serializeStyledPath, header: serializeHeaders, cookie: serializeCookies }

// `.kubb/client.ts` registers the serializers of a spec. These tests register all of them.
function createClientCore<TRequest = NativeRequest, TResponse = NativeResponse>(options: Parameters<typeof createCore<TRequest, TResponse>>[0]) {
  return createCore<TRequest, TResponse>({ ...options, serializer: { ...serializers, ...options.serializer } })
}

client.setConfig({ serializer: serializers })

type Programmed = { data?: unknown; status?: number; statusText?: string; headers?: Record<string, unknown> }

/** The bytes axios reads with `responseType: 'arraybuffer'`: a value as JSON, a string as is. */
function toBytes(data: unknown): unknown {
  if (data instanceof Uint8Array || data instanceof ArrayBuffer || data instanceof Blob || data instanceof ReadableStream || data instanceof Readable)
    return data
  return Buffer.from(typeof data === 'string' ? data : JSON.stringify(data))
}

/**
 * An axios instance stub that records each request config and answers with the programmed response as bytes, as a
 * real instance does for the transport. It never throws on a status, as a real instance with `validateStatus: () => true` does not.
 */
function fakeAxios(result: Programmed = {}) {
  const calls: Array<AxiosRequestConfig> = []
  const request = vi.fn(async (config: AxiosRequestConfig) => {
    calls.push(config)
    const data = result.data ?? { ok: true }
    return {
      data: toBytes(data),
      status: result.status ?? 200,
      statusText: result.statusText ?? 'OK',
      headers: result.headers ?? (typeof data === 'object' ? { 'content-type': 'application/json' } : {}),
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
      ({ data: toBytes({ ok: true }), status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config }) as AxiosResponse,
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

  test('reads a bodiless status and an empty body as no data, as the fetch transport does', async () => {
    const none = createClientCore({ defaultTransport: fakeAxios({ data: '', status: 204, statusText: 'No Content' }).transport })
    const empty = createClientCore({ defaultTransport: fakeAxios({ data: '', headers: { 'content-type': 'text/plain' } }).transport })
    const emptyJson = createClientCore({ defaultTransport: fakeAxios({ data: '', headers: { 'content-type': 'application/json' } }).transport })

    expect(await none({ method: 'DELETE', url: '/pet/1' })).toMatchObject({ status: 204, data: undefined, error: undefined })
    expect(await empty({ method: 'GET', url: '/pet/1' })).toMatchObject({ status: 200, data: undefined })
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

  test('decodes a body by its Content-Type, as the fetch transport does', async () => {
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

  test('decodes a body the Node adapter reads, with every built-in media type', async () => {
    const server = http.createServer((req, res) => {
      const [type, body] = req.url === '/png' ? ['image/png', Buffer.from([1, 2])] : ['application/json', Buffer.from('{"ok":true}')]
      res.writeHead(200, { 'content-type': type })
      res.end(body)
    })
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const base = `http://localhost:${(server.address() as { port: number }).port}`
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'http' })) })

    try {
      expect((await client({ method: 'GET', url: `${base}/json` })).data).toStrictEqual({ ok: true })
      const png = (await client({ method: 'GET', url: `${base}/png` })).data as Blob
      expect(png.type).toBe('image/png')
      expect(new Uint8Array(await png.arrayBuffer())).toStrictEqual(new Uint8Array([1, 2]))
    } finally {
      server.close()
    }
  })

  test('rejects an aborted call with the signal reason, as fetch does', async () => {
    const reason = new Error('stop')
    const fetch = async () => new Response('{}', { headers: { 'content-type': 'application/json' } })
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'fetch', env: { fetch } })) })

    await expect(client({ method: 'GET', url: 'https://petstore.dev/pet', signal: AbortSignal.abort(reason) })).rejects.toBe(reason)
  })

  test('rejects with the signal reason when the abort comes while the body is read', async () => {
    // A stream call makes axios resolve at the headers, so the body is read after `instance.request`.
    const server = http.createServer((_req, res) => (res.writeHead(200, { 'content-type': 'application/json' }), res.write('{"partial":')))
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const url = `http://localhost:${(server.address() as { port: number }).port}/events`
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'http' })) })
    const controller = new AbortController()
    const reason = new Error('stop')

    try {
      const call = client({ method: 'GET', url, signal: controller.signal, parseAs: 'json', options: { responseType: 'stream' } })
      const streamed = client.stream({ method: 'GET', url, signal: controller.signal })
      setTimeout(() => controller.abort(reason), 100)
      await expect(call).rejects.toBe(reason)
      await expect(streamed).rejects.toBe(reason)
    } finally {
      server.closeAllConnections()
      server.close()
    }
  })

  test('rejects with the signal reason when the abort comes while a raw streamed body is read', async () => {
    const server = http.createServer((_req, res) => (res.writeHead(200, { 'content-type': 'application/octet-stream' }), res.write('chunk')))
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const url = `http://localhost:${(server.address() as { port: number }).port}/drip`
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'http' })) })
    const controller = new AbortController()
    const reason = new Error('stop')

    try {
      const { data } = await client({ method: 'GET', url, signal: controller.signal, parseAs: 'stream', contentType: { response: 'text/event-stream' } })
      const reader = (data as ReadableStream<Uint8Array>).getReader()
      await reader.read()
      controller.abort(reason)
      await expect(reader.read()).rejects.toBe(reason)
    } finally {
      server.closeAllConnections()
      server.close()
    }
  })

  test('sends a web ReadableStream body through the fetch adapter, which the Node adapter cannot send', async () => {
    const { instance, calls } = fakeAxios()
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })
    const body = new ReadableStream({ start: (controller) => (controller.enqueue(new TextEncoder().encode('chunk')), controller.close()) })
    await client({ method: 'POST', url: 'https://petstore.dev/upload', body, contentType: 'application/octet-stream' })
    await client({ method: 'POST', url: 'https://petstore.dev/upload', body: 'text', contentType: 'text/plain' })
    expect(calls.map((call) => call.adapter)).toStrictEqual(['fetch', undefined])
  })

  test('keeps the Content-Type of a pre-encoded body sent without a content type through the Node adapter', async () => {
    const sent: Array<string | undefined> = []
    const server = http.createServer((req, res) => (sent.push(req.headers['content-type']), req.resume(), res.writeHead(204).end()))
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const url = `http://localhost:${(server.address() as { port: number }).port}/pet/1`
    const client = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter: 'http' })) })

    try {
      await client({ method: 'PUT', url, body: new Blob(['<pet/>'], { type: 'application/xml' }) })
      await client({ method: 'PUT', url, body: new URLSearchParams({ name: 'odie' }) })
      // axios would label these as a form.
      await client({ method: 'PUT', url, body: '<pet/>' })
      await client({ method: 'PUT', url })
    } finally {
      server.close()
    }

    expect(sent).toStrictEqual(['application/xml', 'application/x-www-form-urlencoded', undefined, undefined])
  })

  test('sends the encoded body and turns URLSearchParams into a string for the Node adapter', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport, mediaTypes: formMediaTypes })

    await client({ method: 'POST', url: '/pet', body: { name: 'odie' } })
    await client({ method: 'POST', url: '/pet', body: { foo: 'a b' }, contentType: 'application/x-www-form-urlencoded' })

    expect(calls[0]).toMatchObject({ data: '{"name":"odie"}', headers: { 'Content-Type': 'application/json' } })
    const transform = calls[1]?.transformRequest as (data: unknown) => unknown
    expect(transform(calls[1]?.data)).toBe('foo=a+b')
    expect(transform('kept')).toBe('kept')
  })

  test('reads bytes, or a stream when the call streams, and streams through the fetch adapter in the browser unless one is set', async () => {
    const { calls, transport } = fakeAxios()
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes })
    const controller = new AbortController()
    vi.stubGlobal('XMLHttpRequest', class {})

    await client({ method: 'GET', url: '/events', parseAs: 'stream', signal: controller.signal })
    await client({ method: 'GET', url: '/events', contentType: { response: 'text/event-stream' }, options: { adapter: 'xhr' } })
    await client({ method: 'GET', url: '/pet', parseAs: 'blob' })
    vi.unstubAllGlobals()

    expect(calls[0]).toMatchObject({ responseType: 'stream', adapter: 'fetch', signal: controller.signal })
    expect(calls[1]).toMatchObject({ responseType: 'stream', adapter: 'xhr' })
    expect(calls[2]).toMatchObject({ responseType: 'arraybuffer' })
    expect(calls[2]?.adapter).toBeUndefined()
  })

  test('reads a blob from the bytes on every adapter, labeled with its media type', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const { transport } = fakeAxios({ data: png, headers: { 'content-type': 'image/png' } })
    const client = createClientCore({ defaultTransport: transport })

    const node = await client({ method: 'GET', url: '/image', parseAs: 'blob' })
    const fetched = await createClientCore({ defaultTransport: fakeAxios({ data: new Blob([png]), headers: { 'content-type': 'image/png' } }).transport })({
      method: 'GET',
      url: '/image',
    })

    for (const { data } of [node, fetched]) {
      expect(data).toBeInstanceOf(Blob)
      expect((data as Blob).type).toBe('image/png')
      expect(new Uint8Array(await (data as Blob).arrayBuffer())).toStrictEqual(new Uint8Array(png))
    }
  })

  test('decodes an error body by its media type, whatever parseAs says', async () => {
    const body = Buffer.from('{"message":"gone"}')
    const { transport } = fakeAxios({ data: body, status: 404, headers: { 'content-type': 'application/json' } })
    const client = createClientCore({ defaultTransport: transport, throwOnError: false })

    expect((await client({ method: 'GET', url: '/image', parseAs: 'blob' })).error).toStrictEqual({ message: 'gone' })
    const { transport: fetchTransport } = fakeAxios({ data: new Blob([body]), status: 404, headers: { 'content-type': 'application/json' } })
    const fetchClient = createClientCore({ defaultTransport: fetchTransport, throwOnError: false })
    expect((await fetchClient({ method: 'GET', url: '/image', parseAs: 'text', options: { adapter: 'fetch' } })).error).toStrictEqual({ message: 'gone' })
  })

  test('keeps the instance adapter for a stream, and the Node adapter outside the browser', async () => {
    const seen: Array<unknown> = []
    const adapter = async (config: InternalAxiosRequestConfig) =>
      (seen.push(config.adapter), { data: toBytes({}), status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse
    const custom = createClientCore({ defaultTransport: createAxiosTransport(axios.create({ adapter })) })
    const { calls, transport } = fakeAxios()
    const node = createClientCore({ defaultTransport: transport })
    vi.stubGlobal('XMLHttpRequest', class {})

    await custom({ method: 'GET', url: '/events', parseAs: 'stream' })
    vi.unstubAllGlobals()
    await node({ method: 'GET', url: '/events', parseAs: 'stream' })

    expect(seen).toStrictEqual([adapter])
    expect(calls[0]?.adapter).toBeUndefined()
  })

  test('rethrows a network error from axios', async () => {
    const networkError = Object.assign(new Error('Network Error'), { isAxiosError: true, name: 'AxiosError' })
    const instance = { request: vi.fn(async () => Promise.reject(networkError)) } as unknown as AxiosInstance
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })
    const seen: Array<unknown> = []
    client.interceptors.error.use((error) => void seen.push(error))

    await expect(client({ method: 'GET', url: '/pet' })).rejects.toBe(networkError)
    expect(seen).toStrictEqual([networkError])
  })

  test('runs client.interceptors next to the axios interceptors of the wrapped instance, which see the raw bytes', async () => {
    const instance = realAxios()
    instance.interceptors.request.use((config) => {
      config.headers.set('X-Axios', 'yes')
      return config
    })
    const intercepted: Array<unknown> = []
    instance.interceptors.response.use((response) => (intercepted.push(response.data), response))
    const client = createClientCore({ defaultTransport: createAxiosTransport(instance) })
    const seen: Array<string> = []
    client.interceptors.request.use((request) => (seen.push(`request ${request.headers['X-Kubb']}`), request))
    client.interceptors.response.use((result) => (seen.push(`response ${result.status}`), result))

    const result = await client({ method: 'GET', url: '/pet', headers: { 'X-Kubb': 'yes' } })

    expect((result.response as AxiosResponse).config.headers.get('X-Axios')).toBe('yes')
    expect(seen).toStrictEqual(['request yes', 'response 200'])
    expect(intercepted[0]).toBeInstanceOf(Uint8Array)
    expect(result.data).toStrictEqual({ ok: true })
  })

  describe('a call that streams', () => {
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
        mediaTypes: streamMediaTypes,
        options: { adapter: answering({ status, body: streamOf(text), contentType }) },
      })
    const accepting = { method: 'GET', url: '/events', contentType: { response: 'text/event-stream' } } as const

    test('decodes a JSON answer to a call that asks for events, and keeps an event stream a stream', async () => {
      expect((await streaming(200, '{"ok":true}', 'application/json')(accepting)).data).toStrictEqual({ ok: true })
      expect((await streaming(200, '{"ok":true}', 'application/problem+json')(accepting)).data).toStrictEqual({ ok: true })
      expect((await streaming(200, 'data: a\n\n', 'text/event-stream')(accepting)).data).toBeInstanceOf(ReadableStream)
      expect((await streaming(200, '{"a":1}\n{"a":2}\n', 'application/x-ndjson')(accepting)).data).toBeInstanceOf(ReadableStream)
    })

    test('reads a JSON body the Node adapter streams as a readable', async () => {
      const client = createClientCore({
        defaultTransport: createAxiosTransport(axios.create()),
        mediaTypes: streamMediaTypes,
        options: { adapter: answering({ body: Readable.from([Buffer.from('{"ok":true}')]), contentType: 'application/json' }) },
      })

      expect((await client(accepting)).data).toStrictEqual({ ok: true })
    })

    test('reads events with client.stream, and throws a ResponseError with a decoded error body', async () => {
      const events = await streaming(200, 'data: a\n\ndata: b\n\n', 'text/event-stream').stream({ method: 'GET', url: '/events' })
      const seen: Array<unknown> = []
      for await (const event of events) seen.push(event)
      expect(seen).toStrictEqual([
        { data: 'a', event: 'message' },
        { data: 'b', event: 'message' },
      ])

      await expect(streaming(404, '{"message":"gone"}', 'application/json').stream({ method: 'GET', url: '/events' })).rejects.toMatchObject({
        name: 'ResponseError',
        status: 404,
        data: { message: 'gone' },
      })
      await expect(streaming(503, 'busy', 'text/plain').stream({ method: 'GET', url: '/events' })).rejects.toMatchObject({
        name: 'ResponseError',
        status: 503,
        data: 'busy',
      })
    })
  })
})

describe('client', () => {
  test('sends through getAxiosInstance(), and through a transport set on the client, a call, or a child', async () => {
    const seen: Array<string> = []
    const transport = (name: string) =>
      createAxiosTransport(
        axios.create({
          adapter: async (config: InternalAxiosRequestConfig) =>
            (seen.push(name), { data: toBytes({}), status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse,
        }),
      )
    using _request = vi
      .spyOn(getAxiosInstance(), 'request')
      .mockImplementation(async (config) => (seen.push('default'), { data: toBytes({}), status: 200, statusText: 'OK', headers: {}, config }) as AxiosResponse)

    await client({ method: 'GET', url: '/pet' })
    await client({ method: 'GET', url: '/pet', transport: transport('call') })
    const child = createClient({ transport: transport('child') })
    await child({ method: 'GET', url: '/pet' })
    child.setConfig({ transport: transport('swapped') })
    await child({ method: 'GET', url: '/pet' })

    expect(seen).toStrictEqual(['default', 'call', 'child', 'swapped'])
  })

  test('creates the axios instance on first use, and returns the same one after', () => {
    expect(getAxiosInstance()).toBe(getAxiosInstance())
  })

  test('runs client.interceptors on the resolved request, the result, and the ResponseError', async () => {
    const own = createClient()
    const seen: Array<string> = []
    const requestId = own.interceptors.request.use((request) => (seen.push(`request ${request.headers['X-Kubb']}`), request))
    own.interceptors.response.use((result) => (seen.push(`response ${result.status}`), result))
    own.interceptors.error.use((error) => (seen.push(`error ${ResponseError.is(error) ? error.status : error.name}`), error))
    const adapter = async (config: InternalAxiosRequestConfig) =>
      ({ data: toBytes({}), status: config.url === '/fail' ? 500 : 200, statusText: 'x', headers: {}, config }) as AxiosResponse

    await own({ method: 'GET', url: '/pet', headers: { 'X-Kubb': 'a' }, options: { adapter } })
    own.interceptors.request.update(requestId, (request) => (seen.push('updated'), request))
    await own({ method: 'GET', url: '/pet', options: { adapter } })
    own.interceptors.request.eject(requestId)
    await expect(own({ method: 'GET', url: '/fail', options: { adapter } })).rejects.toBeInstanceOf(ResponseError)

    expect(seen).toStrictEqual(['request a', 'response 200', 'updated', 'response 200', 'response 500', 'error 500'])
  })
})
