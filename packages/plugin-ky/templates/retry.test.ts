import http from 'node:http'
import type { AddressInfo } from 'node:net'
import ky from 'ky'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'
import { createClient, createKyTransport } from './client.ts'
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
  test('retries the default status codes only, or the custom list', async () => {
    const [unavailable, missing, custom, skipped] = [always(503), always(404), always(404), always(503)]

    await expect(api()({ method: 'GET', url: unavailable, retry: quick })).rejects.toMatchObject({ status: 503 })
    await expect(api()({ method: 'GET', url: missing, retry: quick })).rejects.toMatchObject({ status: 404 })
    await expect(api()({ method: 'GET', url: custom, retry: { statusCodes: [404], ...quick } })).rejects.toMatchObject({ status: 404 })
    await expect(api()({ method: 'GET', url: skipped, retry: { statusCodes: [404], ...quick } })).rejects.toMatchObject({ status: 503 })

    expect([unavailable, missing, custom, skipped].map((url) => seen(url).length)).toStrictEqual([3, 1, 3, 1])
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
})

describe('retry with client.stream', () => {
  test('reopens a stream the server cuts, from the last complete event ID and without losing an event', async () => {
    const url = route((res, count) => (count === 1 ? sse(res, `${event(1)}${event(2)}id: 3\ndata: {"n"`, true) : sse(res, event(3) + event(4))))

    const result = await streams().stream<{ '200': { n: number } }>({ method: 'GET', url })

    expect(await collect(result)).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }])
    expect(result.lastEventId).toBe('4')
    expect(seen(url).map((hit) => hit.headers['last-event-id'])).toStrictEqual([undefined, '2'])
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
