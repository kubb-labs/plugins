import axios from 'axios'
import { describe, expect, test } from 'vitest'
import * as fetchGen from '../gen/httpbin-fetch/index.ts'
import * as axiosGen from '../gen/httpbin-axios/index.ts'
import { toEventStream } from '../gen/httpbin-fetch/.kubb/sse.ts'

const flavors = { fetch: fetchGen, axios: axiosGen as unknown as typeof fetchGen }

describe.each(Object.entries(flavors))('httpbin over %s', (flavor, gen) => {
  const { client, createClient, ResponseError } = gen

  test('serializes query styles and a header parameter', async () => {
    const { data } = await gen.getArgs({
      query: { q: 'a b&c', tags: ['x', 'y'], csv: ['1', '2'], filter: { status: 'ok', min: 3 } },
      headers: { 'X-Custom': 'yes' },
    })
    expect(data.args).toStrictEqual({ q: 'a b&c', tags: ['x', 'y'], csv: '1,2', 'filter[status]': 'ok', 'filter[min]': '3' })
    expect(data.headers?.['X-Custom']).toBe('yes')
    expect(data.url).toBe('https://httpbin.org/get?q=a+b%26c&tags=x&tags=y&csv=1,2&filter%5Bstatus%5D=ok&filter%5Bmin%5D=3')
  })

  test('encodes a path parameter', async () => {
    const { data } = await gen.getAnything({ path: { id: 'a b/c' } })
    expect(data.url).toBe('https://httpbin.org/anything/a%20b%2Fc')
  })

  test('POST, PUT, PATCH JSON and DELETE', async () => {
    const posted = await gen.postJson({ body: { name: 'odie', age: 3, tags: ['dog'] } })
    expect(posted.data.json).toStrictEqual({ name: 'odie', age: 3, tags: ['dog'] })
    expect(posted.data.headers?.['Content-Type']).toBe('application/json')
    const put = await gen.putJson({ body: { name: 'put', age: 1 } })
    expect(put.data.json).toStrictEqual({ name: 'put', age: 1 })
    const patched = await gen.patchJson({ body: { name: 'patch', age: 2 } })
    expect(patched.data.json).toStrictEqual({ name: 'patch', age: 2 })
    const deleted = await gen.deleteIt({})
    expect(deleted.status).toBe(200)
    expect(deleted.data.url).toBe('https://httpbin.org/delete')
  })

  test('sends a urlencoded form', async () => {
    const { data } = await gen.postForm({ body: { name: 'a b', roles: ['x', 'y'] } })
    expect(data.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(data.form).toStrictEqual({ name: 'a b', roles: ['x', 'y'] })
  })

  test('sends multipart with a file and lets the transport set the boundary', async () => {
    const file = new File(['hello multipart'], 'note.txt', { type: 'text/plain' })
    const { data } = await gen.postMultipart({ body: { note: 'kubb', file } })
    expect(data.headers?.['Content-Type']).toMatch(/^multipart\/form-data; boundary=/)
    expect(data.form).toStrictEqual({ note: 'kubb' })
    expect(data.files).toStrictEqual({ file: 'hello multipart' })
  })

  test('204 resolves without data, and an empty 404 or 500 body stays undefined', async () => {
    const none = await gen.getStatus({ path: { code: 204 } })
    expect(none.status).toBe(204)
    expect(none.data).toBeUndefined()

    const error = await gen.getStatus({ path: { code: 404 } }).catch((e: unknown) => e)
    if (!ResponseError.is(error)) throw error
    expect(error.status).toBe(404)
    // httpbin sends an empty text/html body, which both transports read as ''.
    expect(error.data).toBe('')
    expect(error.message).toMatch(/^GET https:\/\/httpbin\.org\/status\/404 failed with status 404( Not Found| NOT FOUND)?$/)

    const boom = await gen.getStatus({ path: { code: 500 }, throwOnError: false })
    expect(boom.status).toBe(500)
    expect(boom.error).toBe('')
    expect(boom.data).toBeUndefined()
  })

  test('reads text and binary bodies', async () => {
    const html = await gen.getHtml({})
    expect(typeof html.data).toBe('string')
    expect(html.data).toContain('<html')

    const bytes = await gen.getBytes({ path: { n: 64 } })
    expect(bytes.contentType).toBe('application/octet-stream')
    expect(bytes.data).toBeInstanceOf(Blob)
    expect((bytes.data as Blob).size).toBe(64)

    const png = await gen.getPng({})
    expect(png.contentType).toBe('image/png')
    const head = new Uint8Array(await (png.data as Blob).slice(0, 4).arrayBuffer())
    expect([...head]).toStrictEqual([0x89, 0x50, 0x4e, 0x47])
  })

  test('resolves basic, bearer, and apiKey auth per scheme', async () => {
    const own = createClient({
      auth: (auth) => {
        if (auth.scheme === 'basic') return 'me:secret'
        if (auth.scheme === 'bearer') return 'tok-123'
        if (auth.type === 'apiKey' && auth.in === 'header') return 'key-in-header'
        return undefined
      },
    })
    const basic = await gen.getBasicAuth({ path: { user: 'me', passwd: 'secret' }, client: own })
    expect(basic.data).toMatchObject({ authenticated: true, user: 'me' })

    const bearer = await gen.getBearer({ client: own })
    expect(bearer.data).toMatchObject({ authenticated: true, token: 'tok-123' })

    const headers = await gen.getHeaders({ client: own })
    expect(headers.data.headers?.['X-Api-Key']).toBe('key-in-header')

    const queryOnly = createClient({ auth: (auth) => (auth.in === 'query' ? 'key-in-query' : undefined) })
    const viaQuery = await gen.getHeaders({ client: queryOnly })
    expect(viaQuery.data.headers?.['X-Api-Key']).toBeUndefined()
    const echoed = (await queryOnly({ method: 'GET', url: '/get', security: [{ type: 'apiKey', name: 'api_key', in: 'query' }] })) as {
      data: { args: unknown }
    }
    expect(echoed.data.args).toStrictEqual({ api_key: 'key-in-query' })

    const unauth = await gen.getBearer({ throwOnError: false })
    expect(unauth.status).toBe(401)
  })

  test('a static auth token and an explicit Authorization header both work', async () => {
    const staticToken = createClient({ auth: 'static-token' })
    const { data } = await gen.getBearer({ client: staticToken })
    expect(data.token).toBe('static-token')
    const explicit = await gen.getBearer({ client: staticToken.createClient({ headers: { Authorization: 'Bearer explicit' } }) })
    expect(explicit.data.token).toBe('explicit')
  })

  test('sends cookie parameters as a Cookie header', async () => {
    // The generated options have no `cookies` field (see findings), so the raw client is used for the runtime check.
    const { data } = (await client({ method: 'GET', url: '/cookies', cookies: { session: 'abc', theme: 'dark' } })) as { data: { cookies: unknown } }
    expect(data.cookies).toStrictEqual({ session: 'abc', theme: 'dark' })
  })

  test('follows a redirect and decompresses gzip', async () => {
    const redirected = await gen.redirectTo({ query: { url: 'https://httpbin.org/get?from=redirect', status_code: 302 } })
    expect(redirected.status).toBe(200)
    expect(redirected.data.args).toStrictEqual({ from: 'redirect' })

    const gzip = await gen.getGzip({})
    expect(gzip.data.gzipped).toBe(true)
  })

  test('setConfig headers merge case-insensitively with call headers', async () => {
    const own = createClient({ headers: { 'x-custom': 'from-client', 'X-Shared': 'client' } })
    const { data } = await gen.getArgs({ headers: { 'X-Custom': 'from-call' }, client: own })
    expect(data.headers?.['X-Custom']).toBe('from-call')
    expect(data.headers?.['X-Shared']).toBe('client')
  })

  test('a timeout signal rejects a slow call with something other than a ResponseError', async () => {
    const error = await gen.getDelay({ path: { seconds: 4 }, signal: AbortSignal.timeout(300) }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect(ResponseError.is(error)).toBe(false)
    expect((error as Error).name).toMatch(/TimeoutError|CanceledError|AbortError/)
  })

  test('a stream call the server answers with JSON throws a TypeError that carries the body', async () => {
    const error = await gen.streamJsonAnswer({}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(TypeError)
    expect((error as TypeError).message).toBe('Expected a text/event-stream body, got application/json')
    expect((error as { cause: unknown }).cause).toMatchObject({ slideshow: expect.anything() })
  })

  test('a stream call that gets 404 throws a ResponseError, or resolves with the status', async () => {
    const error = await gen.streamStatus({ path: { code: 404 } }).catch((e: unknown) => e)
    if (!ResponseError.is(error)) throw error
    expect(error.status).toBe(404)

    const result = await gen.streamStatus({ path: { code: 404 }, throwOnError: false })
    expect(result.status).toBe(404)
    expect(result.data).toBeUndefined()
    const events: Array<unknown> = []
    for await (const event of result.stream) events.push(event)
    expect(events).toStrictEqual([])
  })

  test('a stream call that gets 204 ends as an empty stream', async () => {
    const result = await toEventStream(client({ method: 'GET', url: '/status/204', responseType: 'stream', contentType: { response: 'text/event-stream' } }))
    expect(result.status).toBe(204)
    const events: Array<unknown> = []
    for await (const event of result) events.push(event)
    expect(events).toStrictEqual([])
  })

  test('a network error rejects without running the error interceptor', async () => {
    // 127.0.0.1 is on NO_PROXY, so neither transport goes through the sandbox proxy, which answers 502 for a bad host.
    const own = createClient({ baseURL: 'http://127.0.0.1:1' })
    let ran = false
    own.interceptors.error.use((error) => ((ran = true), error))
    const error = await gen.getArgs({ client: own }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect(ResponseError.is(error)).toBe(false)
    expect(ran).toBe(false)
  })
})

describe('axios specifics', () => {
  test('native axios interceptors on axiosInstance run next to client.interceptors', async () => {
    const id = axiosGen.axiosInstance.interceptors.request.use((config) => {
      config.headers.set('X-Native', 'axios')
      return config
    })
    const coreId = axiosGen.client.interceptors.request.use((request) => ((request.headers['X-Core'] = 'kubb'), request))
    try {
      const { data } = await axiosGen.getArgs({})
      expect(data.headers?.['X-Native']).toBe('axios')
      expect(data.headers?.['X-Core']).toBe('kubb')
    } finally {
      axiosGen.axiosInstance.interceptors.request.eject(id)
      axiosGen.client.interceptors.request.eject(coreId)
    }
  })

  test('a custom axios instance becomes a transport, and its timeout wins', async () => {
    const transport = axiosGen.createAxiosTransport(axios.create({ timeout: 300, headers: { 'X-Instance': 'custom' } }))
    const { data } = await axiosGen.getArgs({ transport })
    expect(data.headers?.['X-Instance']).toBe('custom')
    const error = await axiosGen.getDelay({ path: { seconds: 4 }, transport }).catch((e: unknown) => e)
    expect(axios.isAxiosError(error)).toBe(true)
    expect((error as { code?: string }).code).toBe('ECONNABORTED')
  })

  test('credentials maps onto withCredentials', async () => {
    const result = await axiosGen.getArgs({ credentials: 'include' })
    expect(result.request.withCredentials).toBe(true)
    const none = await axiosGen.getArgs({ credentials: 'omit' })
    expect(none.request.withCredentials).toBe(false)
  })

  test('the fetch adapter streams and parses JSON like the Node adapter', async () => {
    const own = axiosGen.createClient({ transport: axiosGen.createAxiosTransport(axios.create({ adapter: 'fetch' })) })
    const { data } = await axiosGen.postJson({ body: { name: 'fetch-adapter', age: 1 }, client: own })
    expect(data.json).toStrictEqual({ name: 'fetch-adapter', age: 1 })
    const png = await axiosGen.getPng({ client: own })
    expect(png.data).toBeInstanceOf(Blob)
  })
})

describe('fetch specifics', () => {
  test('a transport wrapping defaultTransport sees the resolved request', async () => {
    const seen: Array<string> = []
    const own = fetchGen.createClient({
      transport: async (request) => {
        seen.push(`${request.method} ${request.url} ${request.credentials}`)
        return fetchGen.defaultTransport(request)
      },
      credentials: 'include',
    })
    const result = await fetchGen.getArgs({ query: { q: 'wrapped' }, client: own })
    expect(seen).toStrictEqual(['GET https://httpbin.org/get?q=wrapped include'])
    expect(result.request.credentials).toBe('include')
  })
})
