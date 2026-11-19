import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'
import { createClient, ResponseError } from './client.ts'
import type { Retry, RetryContext } from './client.ts'

type Hit = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string }
type Step = number | ((res: http.ServerResponse) => void)

const hits: Array<Hit> = []
const routes = new Map<string, Array<Step>>()
let baseURL = ''

// Registers a URL that answers each request with the next step, and repeats the last one.
function route(...steps: Array<Step>) {
  const url = `/route-${routes.size}`
  routes.set(url, steps)
  return url
}

const sent = (url: string) => hits.filter((hit) => hit.url === url)

// An event stream that writes `text`, then ends or drops the connection.
function events(text: string, cut = false): Step {
  return (res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.write(text)
    if (cut) setTimeout(() => res.destroy(), 20)
    else res.end()
  }
}

const retryAfter =
  (seconds: string): Step =>
  (res) => {
    res.writeHead(503, { 'retry-after': seconds })
    res.end()
  }

async function collect(items: AsyncIterable<unknown>) {
  const result: Array<unknown> = []
  for await (const item of items) result.push(item)
  return result
}

const server = http.createServer((req, res) => {
  const chunks: Array<Buffer> = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    hits.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() })
    const steps = routes.get(req.url!) ?? [404]
    const step = steps[Math.min(sent(req.url!).length, steps.length) - 1]!
    if (typeof step === 'function') return step(res)
    res.writeHead(step, { 'content-type': 'application/json' })
    res.end(step === 204 ? undefined : JSON.stringify({ status: step }))
  })
})

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  baseURL = `http://localhost:${(server.address() as AddressInfo).port}`
})

afterAll(() => {
  server.closeAllConnections()
  server.close()
})

describe('retry', () => {
  test('sends a call once by default, with retry 0, and with retry false', async () => {
    const url = route(503)

    await expect(createClient({ baseURL })({ url })).rejects.toMatchObject({ status: 503 })
    await expect(createClient({ baseURL, retry: 0 })({ url })).rejects.toMatchObject({ status: 503 })
    await expect(createClient({ baseURL, retry: false })({ url })).rejects.toMatchObject({ status: 503 })
    await expect(createClient({ baseURL })({ url, retry: 0 })).rejects.toMatchObject({ status: 503 })
    expect(sent(url)).toHaveLength(4)
  })

  test('retries up to a number, up to limit, and twice when the object has no limit', async () => {
    const recovers = route(503, 200)
    expect((await createClient({ baseURL, retry: { delay: () => 0 } })({ url: recovers })).data).toEqual({ status: 200 })
    expect(sent(recovers)).toHaveLength(2)

    const shorthand = route(503)
    await expect(createClient({ baseURL, retry: 1 })({ url: shorthand })).rejects.toMatchObject({ status: 503, data: { status: 503 } })
    expect(sent(shorthand)).toHaveLength(2)

    const limited = route(503)
    await expect(createClient({ baseURL, retry: { limit: 3, delay: () => 0 } })({ url: limited })).rejects.toMatchObject({ status: 503 })
    expect(sent(limited)).toHaveLength(4)

    const defaulted = route(503)
    await expect(createClient({ baseURL, retry: { delay: () => 0 } })({ url: defaulted })).rejects.toMatchObject({ status: 503 })
    expect(sent(defaulted)).toHaveLength(3)
  })

  test('retries the default status codes only, or the custom list', async () => {
    const client = createClient({ baseURL, retry: { limit: 1, delay: () => 0 } })
    const busy = route(503)
    const missing = route(404)
    const teapot = route(418)

    await expect(client({ url: busy })).rejects.toMatchObject({ status: 503 })
    expect(sent(busy)).toHaveLength(2)
    await expect(client({ url: missing })).rejects.toMatchObject({ status: 404 })
    expect(sent(missing)).toHaveLength(1)

    await expect(client({ url: teapot, retry: { statusCodes: [418] } })).rejects.toMatchObject({ status: 418 })
    expect(sent(teapot)).toHaveLength(2)
    await expect(client({ url: busy, retry: { statusCodes: [418] } })).rejects.toMatchObject({ status: 503 })
    expect(sent(busy)).toHaveLength(3)
  })

  test('retries a POST only with a methods opt-in, and sends the same body', async () => {
    const client = createClient({ baseURL, retry: { limit: 2, delay: () => 0 } })
    const body = { name: 'Odie' }

    const plain = route(503)
    await expect(client({ url: plain, method: 'POST', body })).rejects.toMatchObject({ status: 503 })
    expect(sent(plain)).toHaveLength(1)

    const optIn = route(503)
    await expect(client({ url: optIn, method: 'POST', body, retry: { methods: ['POST'] } })).rejects.toMatchObject({ status: 503 })
    expect(sent(optIn).map((hit) => [hit.method, hit.body])).toEqual(Array(3).fill(['POST', '{"name":"Odie"}']))
  })

  test('never retries a ReadableStream request body', async () => {
    const url = route(503)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('chunk'))
        controller.close()
      },
    })
    const client = createClient({ baseURL, retry: { limit: 2, delay: () => 0 } })

    await expect(client({ url, method: 'PUT', body, options: { duplex: 'half' } })).rejects.toMatchObject({ status: 503 })
    expect(sent(url).map((hit) => hit.body)).toEqual(['chunk'])
  })

  test('calls delay with the retry count and waits that long', async () => {
    const url = route(503)
    const delay = vi.fn((retryCount: number) => retryCount * 40)
    const started = performance.now()

    await expect(createClient({ baseURL, retry: { limit: 2, delay } })({ url })).rejects.toMatchObject({ status: 503 })
    expect(delay.mock.calls).toEqual([[1], [2]])
    expect(performance.now() - started).toBeGreaterThanOrEqual(115)
    expect(sent(url)).toHaveLength(3)
  })

  test('waits for the Retry-After header instead of delay', async () => {
    const onRetry = vi.fn()
    const delay = vi.fn(() => 60_000)
    const client = createClient({ baseURL, retry: { limit: 1, delay, onRetry } })

    const now = route(retryAfter('0'), 200)
    expect((await client({ url: now })).status).toBe(200)
    expect(delay).not.toHaveBeenCalled()

    const later = route(retryAfter('1'), 200)
    const started = performance.now()
    expect((await client({ url: later })).status).toBe(200)
    expect(performance.now() - started).toBeGreaterThanOrEqual(950)
    expect(onRetry.mock.calls.map(([context]) => context.delay)).toEqual([0, 1000])
    expect(sent(later)).toHaveLength(2)
  })

  test('lets shouldRetry force a retry, veto one, or keep the default', async () => {
    const client = createClient({ baseURL, retry: { limit: 1, delay: () => 0 } })
    const contexts: Array<RetryContext> = []

    const teapot = route(418)
    const force = (context: RetryContext) => {
      contexts.push(context)
      return true
    }
    await expect(client({ url: teapot, retry: { shouldRetry: force } })).rejects.toMatchObject({ status: 418 })
    expect(sent(teapot)).toHaveLength(2)
    expect(contexts).toHaveLength(1)
    expect(contexts[0]).toMatchObject({ retryCount: 1, request: { method: 'GET', url: `${baseURL}${teapot}` } })
    expect(contexts[0]!.response).toBeInstanceOf(Response)
    expect(contexts[0]!.response!.status).toBe(418)
    expect(contexts[0]!.error).toBeUndefined()

    const vetoed = route(503)
    await expect(client({ url: vetoed, retry: { shouldRetry: () => false } })).rejects.toMatchObject({ status: 503 })
    expect(sent(vetoed)).toHaveLength(1)

    const busy = route(503)
    const missing = route(404)
    await expect(client({ url: busy, retry: { shouldRetry: () => undefined } })).rejects.toMatchObject({ status: 503 })
    await expect(client({ url: missing, retry: { shouldRetry: async () => undefined } })).rejects.toMatchObject({ status: 404 })
    expect([sent(busy).length, sent(missing).length]).toEqual([2, 1])
  })

  test('gives onRetry the context and the delay', async () => {
    const url = route(503, 500, 200)
    const onRetry = vi.fn()

    await createClient({ baseURL, retry: { delay: (retryCount) => retryCount, onRetry } })({ url })
    expect(onRetry.mock.calls.map(([context]) => [context.retryCount, context.response.status, context.delay, context.request.url])).toEqual([
      [1, 503, 1, `${baseURL}${url}`],
      [2, 500, 2, `${baseURL}${url}`],
    ])
  })

  test('retries a network error up to the limit and then throws it', async () => {
    const contexts: Array<RetryContext> = []
    const shouldRetry = (context: RetryContext) => {
      contexts.push(context)
      return undefined
    }
    const dropped = route((res) => res.destroy())

    const error = await createClient({ baseURL, retry: { limit: 2, delay: () => 0, shouldRetry } })({ url: dropped }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(TypeError)
    expect((error as TypeError).message).toBe('fetch failed')
    expect(contexts.map((context) => context.retryCount)).toEqual([1, 2])
    expect(contexts[0]!.error).toBeInstanceOf(TypeError)
    expect(contexts[0]!.response).toBeUndefined()
    expect(sent(dropped)).toHaveLength(3)

    const flaky = route((res) => res.destroy(), 200)
    expect((await createClient({ baseURL, retry: { delay: () => 0 } })({ url: flaky })).status).toBe(200)
    expect(sent(flaky)).toHaveLength(2)
  })

  test('merges the retry of a call per field over the retry of the client', async () => {
    const delay = vi.fn(() => 0)
    const client = createClient({ baseURL, retry: { limit: 3, statusCodes: [418], delay } })

    const teapot = route(418)
    await expect(client({ url: teapot, retry: { limit: 1 } })).rejects.toMatchObject({ status: 418 })
    expect(sent(teapot)).toHaveLength(2)
    expect(delay).toHaveBeenCalledTimes(1)

    const shorthand = route(418)
    await expect(client({ url: shorthand, retry: 2 })).rejects.toMatchObject({ status: 418 })
    expect(sent(shorthand)).toHaveLength(3)

    const busy = route(503)
    await expect(client({ url: busy, retry: { statusCodes: [503] } })).rejects.toMatchObject({ status: 503 })
    expect(sent(busy)).toHaveLength(4)

    const off = route(418)
    await expect(client({ url: off, retry: false })).rejects.toMatchObject({ status: 418 })
    expect(sent(off)).toHaveLength(1)
  })

  test('rejects with the abort reason when the signal aborts during the wait', async () => {
    const url = route(503)
    const controller = new AbortController()
    const reason = new Error('stop')
    const started = performance.now()

    // Aborts once the wait has started.
    const retry = { delay: () => 60_000, onRetry: () => void setTimeout(() => controller.abort(reason), 10) }
    await expect(createClient({ baseURL, retry })({ url, signal: controller.signal })).rejects.toBe(reason)
    expect(performance.now() - started).toBeLessThan(30_000)
    expect(sent(url)).toHaveLength(1)
  })

  test('returns the last error response after the retries when throwOnError is false', async () => {
    const url = route(503, 503, 500)

    const result = await createClient({ baseURL, retry: { delay: () => 0 } })({ url, throwOnError: false })
    expect(result).toMatchObject({ status: 500, data: undefined, error: { status: 500 } })
    expect(sent(url)).toHaveLength(3)
  })
})

describe('retry of an event stream', () => {
  const streams = (retry?: Retry) => createClient({ baseURL, mediaTypes: streamMediaTypes, retry })

  test('retries a failed connect', async () => {
    const url = route(503, events('id: 1\ndata: one\n\n'))

    const result = await streams({ delay: () => 0 }).stream({ url })
    expect(await collect(result)).toEqual([{ data: 'one', event: 'message', id: '1' }])
    expect(sent(url)).toHaveLength(2)
  })

  test('reopens a stream the server cuts from the last complete event ID, without losing events', async () => {
    const url = route(events('id: 1\ndata: one\n\nid: 2\ndata: tw', true), events('id: 2\ndata: two\n\nid: 3\ndata: three\n\n'))

    const result = await streams({ delay: () => 0 }).stream({ url })
    expect(await collect(result)).toEqual([
      { data: 'one', event: 'message', id: '1' },
      { data: 'two', event: 'message', id: '2' },
      { data: 'three', event: 'message', id: '3' },
    ])
    expect(sent(url).map((hit) => hit.headers['last-event-id'])).toEqual([undefined, '1'])
    expect(result.lastEventId).toBe('3')
  })

  test('throws the read error of a cut stream when retry is off', async () => {
    const url = route(events('id: 1\ndata: one\n\n', true))

    const result = await streams().stream({ url })
    const received: Array<unknown> = []
    const read = async () => {
      for await (const item of result) received.push(item)
    }
    await expect(read()).rejects.toThrow('terminated')
    expect(received).toEqual([{ data: 'one', event: 'message', id: '1' }])
    expect(sent(url)).toHaveLength(1)
  })

  test('does not reopen a stream that ends normally', async () => {
    const url = route(events('id: 1\ndata: one\n\n'))

    const result = await streams({ delay: () => 0 }).stream({ url })
    expect(await collect(result)).toHaveLength(1)
    expect(sent(url)).toHaveLength(1)
  })

  test('throws a ResponseError when the reconnect gets a status that is not retried', async () => {
    const url = route(events('id: 1\ndata: one\n\n', true), 401)

    const result = await streams({ delay: () => 0 }).stream({ url })
    const error = await collect(result).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ResponseError)
    expect(error).toMatchObject({ status: 401 })
    expect(sent(url)).toHaveLength(2)
  })

  test('ends the stream cleanly when the reconnect gets a 204', async () => {
    const url = route(events('id: 1\ndata: one\n\n', true), 204)

    const result = await streams({ delay: () => 0 }).stream({ url })
    expect(await collect(result)).toEqual([{ data: 'one', event: 'message', id: '1' }])
    expect(sent(url)).toHaveLength(2)
  })

  test('counts a failed connect and the drops after it against one limit, until an event arrives', async () => {
    const url = route(503, events('data: on', true), events('data: tw', true))
    const onRetry = vi.fn()

    const result = await streams({ limit: 2, delay: () => 0, onRetry }).stream({ url })
    await expect(collect(result)).rejects.toThrow('terminated')
    expect(sent(url)).toHaveLength(3)
    expect(onRetry.mock.calls.map(([context]) => context.retryCount)).toEqual([1, 2])

    const cut = () => events('id: 1\ndata: one\n\n', true)
    const reset = route(cut(), cut(), cut(), events('id: 2\ndata: two\n\n'))
    expect(await collect(await streams({ limit: 1, delay: () => 0 }).stream({ url: reset }))).toHaveLength(4)
    expect(sent(reset).map((hit) => hit.headers['last-event-id'])).toEqual([undefined, '1', '1', '1'])
  })
})
