import { describe, expect, test, vi } from 'vitest'
import { createClientCore } from './core.ts'
import type { ResolvedRequest } from './core.ts'
import { serializeCookies } from './serializers/cookies.ts'
import { serializeQuery } from './serializers/query.ts'
import { streamMediaTypes } from './sse.ts'

const busy = () => new Response('busy', { status: 503 })
const ok = () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })

// An event stream that sends `text` and then drops, or closes when `drop` is false.
function events(text: string, drop = false) {
  let sent = false
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!sent) {
        sent = true
        return controller.enqueue(new TextEncoder().encode(text))
      }
      if (drop) return controller.error(new TypeError('terminated'))
      controller.close()
    },
  })
  return new Response(body, { headers: { 'content-type': 'text/event-stream' } })
}

async function collect(items: AsyncIterable<unknown>) {
  const result: Array<unknown> = []
  for await (const item of items) result.push(item)
  return result
}

describe('retry', () => {
  test('waits for Retry-After, and stops waiting on abort', async () => {
    vi.useFakeTimers()
    try {
      const transport = vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'retry-after': '2' } }))
        .mockResolvedValue(ok())
      const onRetry = vi.fn()
      const client = createClientCore({ defaultTransport: transport, retry: { delay: () => 0, onRetry } })

      const call = client({ url: '/pets' })
      await vi.advanceTimersByTimeAsync(1999)
      expect(transport).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(1)
      expect((await call).status).toBe(200)
      expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ delay: 2000 }))

      const controller = new AbortController()
      const down = vi.fn(async () => busy())
      const aborted = client({ url: '/pets', transport: down, signal: controller.signal, retry: { delay: () => 60_000 } })
      const rejection = expect(aborted).rejects.toBe('stop')
      await vi.advanceTimersByTimeAsync(10)
      controller.abort('stop')
      await rejection
      expect(down).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  test('ignores a NaN or infinite limit and an undefined field, and leaves the body for the client after a hook reads it', async () => {
    const transport = vi.fn(async () => busy())
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 3, delay: () => 0 } })

    await expect(client({ url: '/pets', retry: Number.NaN })).rejects.toMatchObject({ status: 503 })
    await expect(client({ url: '/pets', retry: Number.POSITIVE_INFINITY })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(2)

    await expect(client({ url: '/pets', retry: { limit: undefined } })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(6)

    const shouldRetry = async ({ response }: { response?: Response | undefined }) => (await response?.text()) !== 'busy'
    await expect(client({ url: '/pets', retry: { shouldRetry } })).rejects.toMatchObject({ status: 503, data: 'busy' })
    expect(transport).toHaveBeenCalledTimes(7)
  })

  test('sends a call once for a null retry and for a body that can be read once', async () => {
    const transport = vi.fn(async () => busy())

    // JavaScript callers can pass `null`, which the types rule out.
    await expect(createClientCore({ defaultTransport: transport })({ url: '/pets', retry: null as never })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledOnce()

    async function* chunks() {
      yield new Uint8Array([1])
    }
    const client = createClientCore({
      defaultTransport: transport,
      retry: { delay: () => 0 },
      mediaTypes: { 'application/octet-stream': { encode: () => chunks() as never } },
    })
    await expect(client({ url: '/files', method: 'PUT', body: {}, contentType: { request: 'application/octet-stream' } })).rejects.toMatchObject({
      status: 503,
    })
    expect(transport).toHaveBeenCalledTimes(2)
  })

  test('releases the response when shouldRetry throws', async () => {
    const cancel = vi.fn()
    const transport = vi.fn(async () => new Response(new ReadableStream({ cancel }), { status: 503 }))
    const shouldRetry = () => {
      throw new Error('hook failed')
    }

    await expect(createClientCore({ defaultTransport: transport, retry: { shouldRetry } })({ url: '/pets' })).rejects.toThrow('hook failed')
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce())
  })

  test('reads a fractional Retry-After as seconds, and returns the response when the wait is over a minute', async () => {
    const onRetry = vi.fn()
    const answers = [new Response(null, { status: 503, headers: { 'retry-after': '0.01' } }), ok()]
    const client = createClientCore({ defaultTransport: async () => answers.shift()!, retry: { delay: () => 0, onRetry } })

    expect((await client({ url: '/pets' })).status).toBe(200)
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ delay: 10 }))

    const limited = vi.fn(async () => new Response(null, { status: 429, headers: { 'retry-after': '3600' } }))
    await expect(client({ url: '/pets', transport: limited })).rejects.toMatchObject({ status: 429 })
    expect(limited).toHaveBeenCalledOnce()
  })

  test('runs the error interceptors on a failed reopen, and throws a TypeError for a reopen that is not a stream', async () => {
    const client = createClientCore({ defaultTransport: async () => busy(), mediaTypes: streamMediaTypes, retry: { limit: 1, delay: () => 0 } })
    const seen = vi.fn()
    client.interceptors.error.use((error) => void seen(error.name))

    const denied = [events('data: one\n\n', true), new Response(null, { status: 401 })]
    await expect(collect(await client.stream({ url: '/events', transport: async () => denied.shift()! }))).rejects.toMatchObject({ status: 401 })
    expect(seen).toHaveBeenCalledWith('ResponseError')

    const page = [events('data: one\n\n', true), new Response('<html>', { headers: { 'content-type': 'text/html' } })]
    await expect(collect(await client.stream({ url: '/events', transport: async () => page.shift()! }))).rejects.toThrow(TypeError)
  })

  test('reopens a dropped event stream from its last event ID', async () => {
    const requests: Array<ResolvedRequest> = []
    const responses = [busy(), events('id: 1\ndata: one\n\nid: 2\ndata: tw', true), events('id: 2\ndata: two\n\n')]
    const transport = vi.fn(async (request: ResolvedRequest) => {
      requests.push({ ...request, headers: { ...request.headers } })
      return responses.shift()!
    })
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 2, delay: () => 0 } })

    const result = await client.stream({ url: '/events' })
    expect(await collect(result)).toEqual([
      { data: 'one', event: 'message', id: '1' },
      { data: 'two', event: 'message', id: '2' },
    ])
    expect(requests.map((request) => request.headers['Last-Event-ID'])).toEqual([undefined, undefined, '1'])
    expect(result.lastEventId).toBe('2')
  })

  test('keeps the caller Last-Event-ID until an event arrives, and drops it when the server clears the ID', async () => {
    const sent: Array<string | undefined> = []
    const responses = [events('', true), events('id: 6\ndata: six\n\n', true), events('id\ndata: seven\n\n', true), events('data: eight\n\n')]
    const transport = vi.fn(async (request: ResolvedRequest) => {
      sent.push(request.headers['Last-Event-ID'] ?? request.headers['last-event-id'])
      return responses.shift()!
    })
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 3, delay: () => 0 } })

    const result = await client.stream({ url: '/events', headers: { 'last-event-id': '5' } })
    expect(await collect(result)).toHaveLength(3)
    expect(sent).toEqual(['5', '5', '6', undefined])
  })

  test('keeps the caller Last-Event-ID when the events carry no ID, and calls a stream handler on its media type', async () => {
    const sent: Array<string | undefined> = []
    const responses = [events('data: one\n\n', true), events('data: two\n\n')]
    const transport = async (request: ResolvedRequest) => {
      sent.push(request.headers['Last-Event-ID'])
      return responses.shift()!
    }
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 1, delay: () => 0 } })

    expect(await collect(await client.stream({ url: '/events', headers: { 'Last-Event-ID': '5' } }))).toHaveLength(2)
    expect(sent).toEqual(['5', '5'])

    // An `id:` block without data clears the ID before any event arrives.
    responses.push(events('id:\n\n', true), events('data: three\n\n'))
    expect(await collect(await client.stream({ url: '/events', headers: { 'Last-Event-ID': '5' } }))).toHaveLength(1)
    expect(sent.slice(2)).toEqual(['5', undefined])

    const lines = {
      items: ['a', 'b'],
      async *stream(body: ReadableStream<Uint8Array>) {
        await body.cancel()
        yield* this.items
      },
    }
    const custom = createClientCore({ defaultTransport: async () => events('x'), mediaTypes: { 'text/event-stream': lines } })
    expect(await collect(await custom.stream({ url: '/events' }))).toEqual(['a', 'b'])
  })

  test('throws the read error when a dropped stream is out of retries or retry is off', async () => {
    const transport = vi.fn(async () => events('data: on', true))
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes })

    await expect(collect(await client.stream({ url: '/events' }))).rejects.toThrow('terminated')
    expect(transport).toHaveBeenCalledOnce()

    await expect(collect(await client.stream({ url: '/events', retry: { limit: 1, delay: () => 0 } }))).rejects.toThrow('terminated')
    expect(transport).toHaveBeenCalledTimes(3)
  })

  test('asks the auth callback again before a retry and a stream reopen, and a static token once', async () => {
    const requests: Array<ResolvedRequest> = []
    const record = (responses: Array<Response>) => async (request: ResolvedRequest) => {
      requests.push({ ...request, headers: { ...request.headers } })
      return responses.shift()!
    }
    const client = createClientCore({ defaultTransport: async () => ok(), mediaTypes: streamMediaTypes, retry: { limit: 2, delay: () => 0 } })
    let calls = 0
    const auth = vi.fn(() => `token-${++calls}`)

    await client({ url: '/pets', auth, security: [{ type: 'http', scheme: 'bearer' }], transport: record([busy(), ok()]) })
    expect(requests.map((request) => request.headers['Authorization'])).toEqual(['Bearer token-1', 'Bearer token-2'])

    // The query and the cookie header get the new token too, next to the cookie param.
    requests.length = 0
    const stream = await client.stream({
      url: '/events',
      auth,
      security: [
        [
          { type: 'apiKey', name: 'key', in: 'query' },
          { type: 'apiKey', name: 'sid', in: 'cookie' },
        ],
      ],
      cookies: { theme: 'dark' },
      serializer: { query: serializeQuery, cookie: serializeCookies },
      transport: record([events('id: 1\ndata: one\n\n', true), events('data: two\n\n')]),
    })
    await collect(stream)
    expect(requests.map((request) => [request.url, request.headers['Cookie'], request.headers['Last-Event-ID']])).toEqual([
      ['/events?key=token-3', 'sid=token-4; theme=dark', undefined],
      ['/events?key=token-5', 'sid=token-6; theme=dark', '1'],
    ])

    // A header an interceptor replaced stays, and a static token is not resolved twice.
    requests.length = 0
    const eject = client.interceptors.request.use((request) => ({ ...request, headers: { ...request.headers, Authorization: 'Bearer mine' } }))
    await client({ url: '/pets', auth, security: [{ type: 'http', scheme: 'bearer' }], transport: record([busy(), ok()]) })
    client.interceptors.request.eject(eject)
    await client({ url: '/pets', auth: 'static', security: [{ type: 'http', scheme: 'bearer' }], transport: record([busy(), ok()]) })
    expect(requests.map((request) => request.headers['Authorization'])).toEqual(['Bearer mine', 'Bearer mine', 'Bearer static', 'Bearer static'])
  })

  test('starts the retry count over once a reopened stream delivers an event', async () => {
    const responses = [events('data: 1\n\n', true), events('data: 2\n\n', true), events('data: 3\n\n', true), events('data: 4\n\n')]
    const transport = vi.fn(async () => responses.shift()!)
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 1, delay: () => 0 } })

    expect(await collect(await client.stream({ url: '/events' }))).toHaveLength(4)
    expect(transport).toHaveBeenCalledTimes(4)
  })

  test('does not reopen a stream for a parser error or an error status', async () => {
    const large = vi.fn(async () => events('data: too large\n\n'))
    const client = createClientCore({ defaultTransport: large, mediaTypes: streamMediaTypes, retry: { limit: 2, delay: () => 0 } })

    await expect(collect(await client.stream({ url: '/events', maxEventSize: 4 }))).rejects.toThrow(RangeError)
    expect(large).toHaveBeenCalledOnce()

    const responses = [events('data: one\n\n', true), new Response(null, { status: 401 })]
    const gone = vi.fn(async () => responses.shift()!)
    await expect(collect(await client.stream({ url: '/events', transport: gone }))).rejects.toMatchObject({ name: 'ResponseError', status: 401 })
    expect(gone).toHaveBeenCalledTimes(2)
  })
})
