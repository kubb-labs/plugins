import http from 'node:http'
import type { AddressInfo } from 'node:net'
import ky from 'ky'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'
import { createClient, createKyTransport, ResponseError } from './client.ts'
import type { RetryContext } from './client.ts'

type Hit = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string }
type Route = (res: http.ServerResponse, count: number) => void

const hits: Array<Hit> = []
const routes = new Map<string, Route>()
let baseURL = ''

const server = http.createServer((req, res) => {
  const chunks: Array<Buffer> = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    hits.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() })
    routes.get(req.url!)?.(res, seen(req.url!).length)
  })
})

const seen = (url: string) => hits.filter((hit) => hit.url === url)

// Registers a handler under a fresh URL, so every test counts its own requests.
function route(handler: Route): string {
  const url = `/r${routes.size}`
  routes.set(url, handler)
  return url
}

function json(res: http.ServerResponse, status: number, headers: http.OutgoingHttpHeaders = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(JSON.stringify({ status }))
}

const always = (status: number) => route((res) => json(res, status))
// Answers 503 `failures` times and then 200.
const flaky = (failures: number, headers?: http.OutgoingHttpHeaders) => route((res, count) => (count > failures ? json(res, 200) : json(res, 503, headers)))
const dropped = () => route((res) => res.destroy())
const silent = () => route(() => {})

const event = (n: number) => `id: ${n}\ndata: {"n":${n}}\n\n`

// Sends `text` as an event stream, then ends it or cuts the connection.
function sse(res: http.ServerResponse, text: string, cut = false) {
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  res.write(text)
  if (cut) setTimeout(() => res.destroy(), 20)
  else res.end()
}

const quick = { delay: () => 0 }
const api = () => createClient({ baseURL })
const streams = () => createClient({ baseURL, mediaTypes: streamMediaTypes, retry: { limit: 2, ...quick } })

async function collect(events: AsyncIterable<{ data: unknown }>, into: Array<unknown> = []) {
  for await (const item of events) into.push(item.data)
  return into
}

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  baseURL = `http://localhost:${(server.address() as AddressInfo).port}`
})

afterAll(() => {
  server.closeAllConnections()
  server.close()
})

describe('retry', () => {
  test('sends a call once by default, with retry: 0, and with retry: false', async () => {
    const [unset, zero, off] = [always(503), always(503), always(503)]

    await expect(api()({ method: 'GET', url: unset })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: zero, retry: 0 })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: off, retry: false })).rejects.toMatchObject({ status: 503 })

    expect([unset, zero, off].map((url) => seen(url).length)).toStrictEqual([1, 1, 1])
  })

  test('takes a number as the limit, an object limit, and defaults the limit to 2', async () => {
    const [short, limited, fallback, recovers] = [always(503), always(503), always(503), flaky(1)]

    await expect(createClient({ baseURL, retry: 1 })({ method: 'GET', url: short, retry: quick })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: limited, retry: { limit: 3, ...quick } })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: fallback, retry: quick })).rejects.toMatchObject({ status: 503 })
    expect((await api()({ method: 'GET', url: recovers, retry: quick })).status).toBe(200)

    expect([short, limited, fallback, recovers].map((url) => seen(url).length)).toStrictEqual([2, 4, 3, 2])
  })

  test('retries the default status codes only, or the custom list', async () => {
    const [unavailable, missing, custom, skipped] = [always(503), always(404), always(404), always(503)]

    await expect(api()({ method: 'GET', url: unavailable, retry: quick })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: missing, retry: quick })).rejects.toMatchObject({ status: 404 })
    await expect(api()({ method: 'GET', url: custom, retry: { statusCodes: [404], ...quick } })).rejects.toMatchObject({ status: 404 })
    await expect(api()({ method: 'GET', url: skipped, retry: { statusCodes: [404], ...quick } })).rejects.toMatchObject({ status: 503 })

    expect([unavailable, missing, custom, skipped].map((url) => seen(url).length)).toStrictEqual([3, 1, 3, 1])
  })

  test('retries a POST only with a methods opt-in or an Idempotency-Key header, and sends the same body each time', async () => {
    const [plain, optedIn, keyed] = [always(503), always(503), always(503)]
    const body = { name: 'Odie' }

    await expect(api()({ method: 'POST', url: plain, body, retry: quick })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'POST', url: optedIn, body, retry: { methods: ['POST'], ...quick } })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'POST', url: keyed, body, headers: { 'Idempotency-Key': 'abc' }, retry: quick })).rejects.toMatchObject({ status: 503 })

    expect(seen(plain)).toHaveLength(1)
    expect(seen(optedIn).map((hit) => hit.body)).toStrictEqual(Array(3).fill('{"name":"Odie"}'))
    expect(seen(keyed).map((hit) => [hit.body, hit.headers['idempotency-key']])).toStrictEqual(Array(3).fill(['{"name":"Odie"}', 'abc']))
  })

  test('never retries a ReadableStream request body', async () => {
    const url = always(503)
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('chunk'))
        controller.close()
      },
    })

    await expect(
      api()({ method: 'POST', url, body, headers: { 'Content-Type': 'text/plain' }, retry: { methods: ['POST'], ...quick }, options: { duplex: 'half' } }),
    ).rejects.toMatchObject({ status: 503 })

    expect(seen(url).map((hit) => hit.body)).toStrictEqual(['chunk'])
  })

  test('calls delay with the retry count and waits that long', async () => {
    const url = always(503)
    const delay = vi.fn((retryCount: number) => retryCount * 40)
    const started = performance.now()

    await expect(api()({ method: 'GET', url, retry: { delay } })).rejects.toMatchObject({ status: 503 })

    expect(delay.mock.calls).toStrictEqual([[1], [2]])
    expect(performance.now() - started).toBeGreaterThanOrEqual(110)
    expect(seen(url)).toHaveLength(3)
  })

  test('waits for the Retry-After header instead of delay', async () => {
    const [later, now] = [flaky(1, { 'retry-after': '1' }), flaky(1, { 'retry-after': '0' })]
    const delays: Array<number> = []
    const onRetry = (context: { delay: number }) => void delays.push(context.delay)

    let started = performance.now()
    expect((await api()({ method: 'GET', url: later, retry: { ...quick, onRetry } })).status).toBe(200)
    expect(performance.now() - started).toBeGreaterThanOrEqual(950)

    started = performance.now()
    expect((await api()({ method: 'GET', url: now, retry: { delay: () => 5000, onRetry } })).status).toBe(200)
    expect(performance.now() - started).toBeLessThan(1000)

    expect(delays).toStrictEqual([1000, 0])
    expect([later, now].map((url) => seen(url).length)).toStrictEqual([2, 2])
  })

  test('lets shouldRetry force a retry, veto one, or keep the default, and passes it the request, the response, and the count', async () => {
    const [forced, vetoed, kept, keptMissing] = [always(404), always(503), always(503), always(404)]
    const contexts: Array<RetryContext> = []
    const force = (context: RetryContext) => (contexts.push(context), true)

    await expect(api()({ method: 'GET', url: forced, retry: { shouldRetry: force, ...quick } })).rejects.toMatchObject({ status: 404 })
    await expect(api()({ method: 'GET', url: vetoed, retry: { shouldRetry: () => false, ...quick } })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: kept, retry: { shouldRetry: () => undefined, ...quick } })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: keptMissing, retry: { shouldRetry: () => undefined, ...quick } })).rejects.toMatchObject({ status: 404 })

    expect([forced, vetoed, kept, keptMissing].map((url) => seen(url).length)).toStrictEqual([3, 1, 3, 1])
    // Two entries: the limit stops the third failure before `shouldRetry` runs.
    expect(contexts.map((context) => [context.request.url, context.request.method, context.response?.status, context.error, context.retryCount])).toStrictEqual(
      [
        [`${baseURL}${forced}`, 'GET', 404, undefined, 1],
        [`${baseURL}${forced}`, 'GET', 404, undefined, 2],
      ],
    )
  })

  test('passes onRetry the context and the delay before each retry', async () => {
    const url = always(503)
    const calls: Array<unknown> = []
    const onRetry = (context: RetryContext & { delay: number }) =>
      void calls.push([context.request.url, context.response?.status, context.retryCount, context.delay, seen(url).length])

    await expect(api()({ method: 'GET', url, retry: { delay: () => 7, onRetry } })).rejects.toMatchObject({ status: 503 })

    expect(calls).toStrictEqual([
      [`${baseURL}${url}`, 503, 1, 7, 1],
      [`${baseURL}${url}`, 503, 2, 7, 2],
    ])
  })

  test('retries a network error up to the limit, then throws it', async () => {
    const contexts: Array<RetryContext> = []
    const shouldRetry = (context: RetryContext) => void contexts.push(context)
    const closed = await api()({ method: 'GET', url: '/x', baseURL: 'http://127.0.0.1:1', retry: { shouldRetry, ...quick } }).catch((error: unknown) => error)

    expect(closed).toMatchObject({ name: 'NetworkError' })
    expect(contexts.map((context) => [(context.error as Error).name, context.response, context.retryCount])).toStrictEqual([
      ['NetworkError', undefined, 1],
      ['NetworkError', undefined, 2],
    ])

    const url = dropped()
    await expect(api()({ method: 'GET', url, retry: quick })).rejects.toMatchObject({ name: 'NetworkError' })
    expect(seen(url)).toHaveLength(3)
  })

  test('retries a Ky TimeoutError up to the limit', async () => {
    const url = silent()

    await expect(api()({ method: 'GET', url, retry: quick, options: { timeout: 50 } })).rejects.toMatchObject({ name: 'TimeoutError' })

    expect(seen(url)).toHaveLength(3)
  })

  test('merges the retry of a call per field over the retry of the client, and false turns it off', async () => {
    const [merged, numbered, off] = [always(404), always(404), always(404)]
    const own = createClient({ baseURL, retry: { limit: 3, statusCodes: [404], ...quick } })

    await expect(own({ method: 'GET', url: merged, retry: { limit: 1 } })).rejects.toMatchObject({ status: 404 })
    await expect(own({ method: 'GET', url: numbered, retry: 2 })).rejects.toMatchObject({ status: 404 })
    await expect(own({ method: 'GET', url: off, retry: false })).rejects.toMatchObject({ status: 404 })

    expect([merged, numbered, off].map((url) => seen(url).length)).toStrictEqual([2, 3, 1])
  })

  test('rejects with the abort reason when the signal aborts during the wait', async () => {
    const url = always(503)
    const controller = new AbortController()
    const reason = new Error('stop')
    const started = performance.now()

    const call = api()({
      method: 'GET',
      url,
      signal: controller.signal,
      retry: { delay: () => 5000, onRetry: () => void setTimeout(() => controller.abort(reason), 30) },
    })

    await expect(call).rejects.toBe(reason)
    expect(performance.now() - started).toBeLessThan(1000)
    expect(seen(url)).toHaveLength(1)
  })

  test('returns the last error response after the retries with throwOnError: false', async () => {
    const url = always(503)

    const result = await api()({ method: 'GET', url, throwOnError: false, retry: quick })

    expect(result).toMatchObject({ status: 503, error: { status: 503 }, data: undefined })
    expect(seen(url)).toHaveLength(3)
  })
})

describe('retry with client.stream', () => {
  test('retries a failed connect', async () => {
    const url = route((res, count) => (count === 1 ? json(res, 503) : sse(res, event(1) + event(2))))

    const result = await streams().stream<{ '200': { n: number } }>({ method: 'GET', url })

    expect(await collect(result)).toStrictEqual([{ n: 1 }, { n: 2 }])
    expect(seen(url)).toHaveLength(2)
  })

  test('reopens a stream the server cuts, from the last complete event ID and without losing an event', async () => {
    const url = route((res, count) => (count === 1 ? sse(res, `${event(1)}${event(2)}id: 3\ndata: {"n"`, true) : sse(res, event(3) + event(4))))

    const result = await streams().stream<{ '200': { n: number } }>({ method: 'GET', url })

    expect(await collect(result)).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }])
    expect(result.lastEventId).toBe('4')
    expect(seen(url).map((hit) => hit.headers['last-event-id'])).toStrictEqual([undefined, '2'])
  })

  test('throws from the loop when the stream is cut and retry is off', async () => {
    const url = route((res) => sse(res, event(1), true))
    const data: Array<unknown> = []

    const result = await createClient({ baseURL, mediaTypes: streamMediaTypes }).stream({ method: 'GET', url })

    await expect(collect(result, data)).rejects.toThrow('terminated')
    expect(data).toStrictEqual([{ n: 1 }])
    expect(seen(url)).toHaveLength(1)
  })

  test('does not reopen a stream that ends normally', async () => {
    const url = route((res) => sse(res, event(1)))

    expect(await collect(await streams().stream({ method: 'GET', url }))).toStrictEqual([{ n: 1 }])
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(seen(url)).toHaveLength(1)
  })

  test('throws a ResponseError when the reconnect gets a status that is not retried', async () => {
    const url = route((res, count) => (count === 1 ? sse(res, event(1), true) : json(res, 404)))
    const data: Array<unknown> = []

    const error = await collect(await streams().stream({ method: 'GET', url }), data).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(ResponseError)
    expect(error).toMatchObject({ status: 404 })
    expect(data).toStrictEqual([{ n: 1 }])
    expect(seen(url)).toHaveLength(2)
  })

  test('ends the stream when the reconnect gets a 204', async () => {
    const url = route((res, count) => (count === 1 ? sse(res, event(1), true) : res.writeHead(204).end()))

    expect(await collect(await streams().stream({ method: 'GET', url }))).toStrictEqual([{ n: 1 }])
    expect(seen(url)).toHaveLength(2)
  })

  test('shares the limit between connects and reopens', async () => {
    const url = route((res, count) => (count === 1 ? json(res, 503) : sse(res, event(count), true)))
    const data: Array<unknown> = []

    const result = await streams().stream({ method: 'GET', url })

    await expect(collect(result, data)).rejects.toThrow('terminated')
    expect(data).toStrictEqual([{ n: 2 }, { n: 3 }])
    expect(seen(url).map((hit) => hit.headers['last-event-id'])).toStrictEqual([undefined, undefined, '2'])
  })
})

describe('retry next to the retry of Ky', () => {
  const kyRetry = { limit: 2, delay: () => 0 }

  test('keeps the retry of Ky off, on the default transport and on a custom instance', async () => {
    const [unavailable, cut, custom, customCut] = [always(503), dropped(), always(503), dropped()]
    const beforeRetry = vi.fn()
    const options = { hooks: { beforeRetry: [beforeRetry] } }
    const own = createClient({ baseURL, transport: createKyTransport(ky.create({ retry: 0 })), options })

    await expect(api()({ method: 'GET', url: unavailable, retry: quick, options })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: cut, retry: quick, options })).rejects.toMatchObject({ name: 'NetworkError' })
    await expect(own({ method: 'GET', url: custom, retry: quick })).rejects.toMatchObject({ status: 503 })
    await expect(own({ method: 'GET', url: customCut, retry: quick })).rejects.toMatchObject({ name: 'NetworkError' })

    expect([unavailable, cut, custom, customCut].map((url) => seen(url).length)).toStrictEqual([3, 3, 3, 3])
    expect(beforeRetry).not.toHaveBeenCalled()
  })

  test('multiplies the attempts on a network error when both retries are set, but not on an error status', async () => {
    const [unavailable, cut] = [always(503), dropped()]
    const beforeRetry = vi.fn()
    const options = { retry: kyRetry, hooks: { beforeRetry: [beforeRetry] } }
    const onRetry = vi.fn()

    await expect(api()({ method: 'GET', url: unavailable, retry: quick, options })).rejects.toMatchObject({ status: 503 })
    expect(seen(unavailable)).toHaveLength(3)
    expect(beforeRetry).not.toHaveBeenCalled()

    await expect(api()({ method: 'GET', url: cut, retry: quick, options })).rejects.toMatchObject({ name: 'NetworkError' })
    expect(seen(cut)).toHaveLength(9)

    beforeRetry.mockClear()
    await expect(api()({ method: 'GET', url: '/x', baseURL: 'http://127.0.0.1:1', retry: { ...quick, onRetry }, options })).rejects.toMatchObject({
      name: 'NetworkError',
    })
    expect([onRetry.mock.calls.length, beforeRetry.mock.calls.length]).toStrictEqual([2, 6])
  })
})
