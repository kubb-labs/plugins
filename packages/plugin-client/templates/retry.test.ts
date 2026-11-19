import { describe, expect, test, vi } from 'vitest'
import { createClientCore } from './core.ts'
import type { ResolvedRequest } from './core.ts'
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
  test('sends a call once unless retry is set', async () => {
    const transport = vi.fn(async () => busy())
    const client = createClientCore({ defaultTransport: transport })

    await expect(client({ url: '/pets' })).rejects.toMatchObject({ status: 503 })
    await expect(client({ url: '/pets', retry: 0 })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(2)
  })

  test('retries a status and a transport error up to the limit', async () => {
    const transport = vi.fn().mockResolvedValueOnce(busy()).mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValue(ok())
    const onRetry = vi.fn()
    const client = createClientCore({ defaultTransport: transport, retry: { delay: () => 0, onRetry } })

    expect((await client({ url: '/pets' })).data).toEqual({ ok: true })
    expect(transport).toHaveBeenCalledTimes(3)
    expect(onRetry.mock.calls.map(([context]) => [context.retryCount, context.response?.status, context.delay])).toEqual([
      [1, 503, 0],
      [2, undefined, 0],
    ])

    const down = vi.fn(async () => busy())
    await expect(client({ url: '/pets', transport: down, retry: 1 })).rejects.toMatchObject({ status: 503, data: 'busy' })
    expect(down).toHaveBeenCalledTimes(2)
  })

  test('leaves other statuses and unsafe methods alone', async () => {
    const missing = vi.fn(async () => new Response(null, { status: 404 }))
    const transport = vi.fn(async () => busy())
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 2, delay: () => 0 } })

    await expect(client({ url: '/pets', transport: missing })).rejects.toMatchObject({ status: 404 })
    expect(missing).toHaveBeenCalledOnce()

    await expect(client({ url: '/pets', method: 'POST', body: { name: 'Odie' } })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledOnce()

    await expect(client({ url: '/pets', method: 'PUT', body: new ReadableStream() })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(2)
  })

  test('retries an unsafe method only with a per-call opt-in', async () => {
    const transport = vi.fn(async () => busy())
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 1, delay: () => 0 } })

    await expect(client({ url: '/orders', method: 'POST' })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(1)

    // The call keeps the client's limit and delay.
    await expect(client({ url: '/orders', method: 'POST', retry: { methods: ['POST'] } })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(3)

    await expect(client({ url: '/pets', retry: false })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledTimes(4)
  })

  test('lets shouldRetry decide, within the limit', async () => {
    const transport = vi.fn(async () => new Response(null, { status: 418 }))
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 1, delay: () => 0 } })

    await expect(client({ url: '/pets', retry: { shouldRetry: ({ response }) => response?.status === 418 } })).rejects.toMatchObject({ status: 418 })
    expect(transport).toHaveBeenCalledTimes(2)

    const down = vi.fn(async () => busy())
    await expect(client({ url: '/pets', transport: down, retry: { shouldRetry: () => false } })).rejects.toMatchObject({ status: 503 })
    expect(down).toHaveBeenCalledOnce()
  })

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

  test('throws the read error when a dropped stream is out of retries or retry is off', async () => {
    const transport = vi.fn(async () => events('data: one\n\n', true))
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes })

    await expect(collect(await client.stream({ url: '/events' }))).rejects.toThrow('terminated')
    expect(transport).toHaveBeenCalledOnce()

    await expect(collect(await client.stream({ url: '/events', retry: { limit: 1, delay: () => 0 } }))).rejects.toThrow('terminated')
    expect(transport).toHaveBeenCalledTimes(3)
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
