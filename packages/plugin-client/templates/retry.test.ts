import { afterEach, describe, expect, test, vi } from 'vitest'
import { createClientCore, type Retry, type ResolvedRequest } from './core.ts'
import { streamMediaTypes } from './sse.ts'

afterEach(() => vi.useRealTimers())

async function collect(items: AsyncIterable<unknown>) {
  const result: Array<unknown> = []
  for await (const item of items) result.push(item)
  return result
}

function eventBody({ fail = false }: { fail?: boolean } = {}) {
  let sent = false
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!sent) {
        sent = true
        controller.enqueue(new TextEncoder().encode('id: 7\nretry: 0\ndata: hello\n\n'))
        return
      }
      if (fail) return controller.error(new Error('connection lost'))
      controller.close()
    },
  })
}

describe('shared retries', () => {
  test('allows explicit method opt-in and disables native retries', async () => {
    const transport = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network failure'))
      .mockResolvedValue(new Response(null, { status: 204 }))
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 1, methods: ['POST'], delay: () => 0 } })
    await client({ url: '/events', method: 'POST', options: { retry: 5 } })
    expect(transport).toHaveBeenCalledTimes(2)
    expect(transport).toHaveBeenLastCalledWith(expect.objectContaining({ options: { retry: 0 } }))
  })

  test('lets a call disable client retries', async () => {
    const transport = vi.fn(async () => new Response(null, { status: 503 }))
    const client = createClientCore({ defaultTransport: transport, retry: 2 })
    await expect(client.stream({ url: '/events', retry: false })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledOnce()
  })

  test('uses shouldRetry to veto retryable HTTP statuses', async () => {
    const transport = vi.fn(async () => new Response(null, { status: 503 }))
    const client = createClientCore({ defaultTransport: transport, retry: { shouldRetry: () => false } })
    await expect(client({ url: '/events' })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledOnce()
  })

  test.each([false, 0, undefined] satisfies Array<Retry | undefined>)('does not retry with %s', async (retry) => {
    const transport = vi.fn(async () => new Response('busy', { status: 503 }))
    const client = createClientCore({ defaultTransport: transport })
    await expect(client({ url: '/events', retry })).rejects.toMatchObject({ status: 503 })
    expect(transport).toHaveBeenCalledOnce()
  })

  test('merges per-call retry fields and retries SSE connection statuses', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValue(new Response(eventBody(), { headers: { 'content-type': 'text/event-stream' } }))
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 1, delay: () => 0, statusCodes: [429] } })
    const result = await client.stream({ url: '/events', retry: { statusCodes: [503] } })
    expect(await collect(result)).toStrictEqual([{ data: 'hello', event: 'message', id: '7', retry: 0 }])
    expect(transport).toHaveBeenCalledTimes(2)
  })

  test('reconnects a dropped SSE stream with the committed ID and server delay', async () => {
    const requests: Array<ResolvedRequest> = []
    const transport = vi.fn(async (request: ResolvedRequest) => {
      requests.push({ ...request, headers: { ...request.headers } })
      return new Response(eventBody({ fail: requests.length === 1 }), { headers: { 'content-type': 'text/event-stream' } })
    })
    const onRetry = vi.fn()
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 1, delay: () => 60_000, onRetry } })
    const result = await client.stream({ url: '/events' })
    expect(await collect(result)).toHaveLength(2)
    expect(result.lastEventId).toBe('7')
    expect(requests[1]?.headers['Last-Event-ID']).toBe('7')
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ retryCount: 1, delay: 0 }))
    expect(transport).toHaveBeenCalledTimes(2)
  })

  test('shares the limit across failed connections and dropped reads', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockImplementation(async () => new Response(eventBody({ fail: true }), { headers: { 'content-type': 'text/event-stream' } }))
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: { limit: 1, delay: () => 0 } })
    await expect(collect(await client.stream({ url: '/events' }))).rejects.toThrow('connection lost')
    expect(transport).toHaveBeenCalledTimes(2)
  })

  test.each(['POST', 'GET'])('does not replay unsafe %s bodies', async (method) => {
    const transport = vi.fn(async () => {
      throw new TypeError('network failure')
    })
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 2, delay: () => 0 } })
    await expect(client({ url: '/events', method, body: method === 'GET' ? eventBody() : 'write' })).rejects.toThrow()
    expect(transport).toHaveBeenCalledOnce()
  })

  test('honors Retry-After and cancels backoff immediately', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const onRetry = vi.fn()
    const transport = vi.fn(async () => new Response(null, { status: 429, headers: { 'Retry-After': '10' } }))
    const client = createClientCore({ defaultTransport: transport, retry: { limit: 1, onRetry } })
    const result = client({ url: '/events', signal: controller.signal })
    const rejected = expect(result).rejects.toThrow('stop')
    await vi.advanceTimersByTimeAsync(0)
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ delay: 10_000 }))
    controller.abort(new Error('stop'))
    await rejected
    expect(transport).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('does not reconnect after a consumer break or transform failure', async () => {
    const transport = vi.fn(async () => new Response(eventBody(), { headers: { 'content-type': 'text/event-stream' } }))
    const client = createClientCore({ defaultTransport: transport, mediaTypes: streamMediaTypes, retry: 2 })
    for await (const _event of await client.stream({ url: '/events' })) break
    expect(transport).toHaveBeenCalledOnce()
    const result = await client.stream({
      url: '/events',
      transform() {
        throw new TypeError('bad event')
      },
    })
    await expect(collect(result)).rejects.toThrow('bad event')
    expect(transport).toHaveBeenCalledTimes(2)
  })
})
