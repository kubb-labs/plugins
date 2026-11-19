import http from 'node:http'
import type { AddressInfo } from 'node:net'
import axios from 'axios'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'
import { createAxiosTransport, createClient } from './client.ts'
import type { RetryContext } from './client.ts'

type Hit = { method?: string; headers: http.IncomingHttpHeaders; body: string }
type Step = (res: http.ServerResponse) => void

const plans = new Map<string, { steps: Array<Step>; hits: Array<Hit> }>()
let baseURL = ''

// Registers a URL that answers its nth request with the nth step. The last step repeats.
function plan(...steps: Array<Step>) {
  const url = `/plan/${plans.size}`
  const hits: Array<Hit> = []
  plans.set(url, { steps, hits })
  return { url, hits }
}

const answer =
  (status: number, headers: http.OutgoingHttpHeaders = {}): Step =>
  (res) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers })
    res.end(status === 204 ? undefined : JSON.stringify({ status }))
  }

const never: Step = () => {}

// Sends `text` as an event stream, then ends it, or cuts the socket when `cut` is set.
const events =
  (text: string, cut = false): Step =>
  (res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.write(text)
    setTimeout(() => (cut ? res.destroy() : res.end()), 30)
  }

const server = http.createServer((req, res) => {
  const chunks: Array<Buffer> = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', () => {
    const { steps, hits } = plans.get(req.url!)!
    hits.push({ method: req.method, headers: req.headers, body: Buffer.concat(chunks).toString() })
    steps[Math.min(hits.length, steps.length) - 1]!(res)
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

const fast = { delay: () => 0 }

async function collect(items: AsyncIterable<unknown>) {
  const result: Array<unknown> = []
  for await (const item of items) result.push(item)
  return result
}

describe('retry through the axios transport', () => {
  test('retries a 503 and not a 404 by default, and follows a custom status list', async () => {
    const client = createClient({ baseURL, retry: { limit: 1, ...fast } })
    const busy = plan(answer(503))
    const missing = plan(answer(404))

    await expect(client({ method: 'GET', url: busy.url })).rejects.toMatchObject({ status: 503 })
    await expect(client({ method: 'GET', url: missing.url })).rejects.toMatchObject({ status: 404 })
    expect([busy.hits.length, missing.hits.length]).toStrictEqual([2, 1])

    await expect(client({ method: 'GET', url: busy.url, retry: { statusCodes: [404] } })).rejects.toMatchObject({ status: 503 })
    await expect(client({ method: 'GET', url: missing.url, retry: { statusCodes: [404] } })).rejects.toMatchObject({ status: 404 })
    expect([busy.hits.length, missing.hits.length]).toStrictEqual([3, 3])
  })

  test('lets shouldRetry retry, veto, or keep the default, with a web Response in its context', async () => {
    const client = createClient({ baseURL, retry: { limit: 1, ...fast } })
    const contexts: Array<RetryContext> = []

    const teapot = plan(answer(418, { 'x-trace': 'abc' }))
    const shouldRetry = (context: RetryContext) => (contexts.push(context), true)
    await expect(client({ method: 'GET', url: teapot.url, retry: { shouldRetry } })).rejects.toMatchObject({ status: 418 })
    expect(teapot.hits).toHaveLength(2)
    expect(contexts).toHaveLength(1)
    expect(contexts[0]!.response).toBeInstanceOf(Response)
    expect(contexts[0]!.response!.headers.get('x-trace')).toBe('abc')
    expect(contexts[0]!.error).toBeUndefined()
    expect(contexts[0]).toMatchObject({ retryCount: 1, request: { method: 'GET', url: `${baseURL}${teapot.url}` } })

    const vetoed = plan(answer(503))
    await expect(client({ method: 'GET', url: vetoed.url, retry: { shouldRetry: () => false } })).rejects.toMatchObject({ status: 503 })
    expect(vetoed.hits).toHaveLength(1)

    const busy = plan(answer(503))
    const missing = plan(answer(404))
    await expect(client({ method: 'GET', url: busy.url, retry: { shouldRetry: () => undefined } })).rejects.toMatchObject({ status: 503 })
    await expect(client({ method: 'GET', url: missing.url, retry: { shouldRetry: () => undefined } })).rejects.toMatchObject({ status: 404 })
    expect([busy.hits.length, missing.hits.length]).toStrictEqual([2, 1])
  })

  test('retries a network error up to the limit, then throws the AxiosError', async () => {
    const onRetry = vi.fn()
    const client = createClient({ baseURL: 'http://127.0.0.1:1', retry: { ...fast, onRetry } })

    const error = await client({ method: 'GET', url: '/pets' }).catch((caught: unknown) => caught)
    expect(axios.isAxiosError(error)).toBe(true)
    expect(error).toMatchObject({ code: 'ECONNREFUSED' })
    expect(onRetry.mock.calls.map(([context]) => [context.retryCount, context.response, axios.isAxiosError(context.error)])).toStrictEqual([
      [1, undefined, true],
      [2, undefined, true],
    ])
  })

  test('retries an axios timeout as a transport error', async () => {
    const { url, hits } = plan(never)
    const client = createClient({ baseURL, options: { timeout: 50 }, retry: { limit: 1, ...fast } })

    await expect(client({ method: 'GET', url })).rejects.toMatchObject({ name: 'AxiosError', code: 'ECONNABORTED' })
    expect(hits).toHaveLength(2)
  })

  test('rejects with the abort reason when the signal aborts during the wait', async () => {
    const { url, hits } = plan(answer(503))
    const controller = new AbortController()
    const reason = new Error('stop')
    const started = performance.now()

    setTimeout(() => controller.abort(reason), 50)
    await expect(createClient({ baseURL, retry: { delay: () => 60_000 } })({ method: 'GET', url, signal: controller.signal })).rejects.toBe(reason)
    expect(performance.now() - started).toBeLessThan(30_000)
    expect(hits).toHaveLength(1)
  })

  test('does not retry a call aborted in flight', async () => {
    const { url, hits } = plan(never)
    const controller = new AbortController()
    const reason = new Error('stop')
    const onRetry = vi.fn()

    setTimeout(() => controller.abort(reason), 50)
    await expect(createClient({ baseURL, retry: { ...fast, onRetry } })({ method: 'GET', url, signal: controller.signal })).rejects.toBe(reason)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(hits).toHaveLength(1)
    expect(onRetry).not.toHaveBeenCalled()
  })
})

describe('retry of an event stream through the axios transport', () => {
  const one = { data: 'one', event: 'message', id: '1' }
  const two = { data: 'two', event: 'message', id: '2' }
  const cut = () => events('id: 1\ndata: one\n\nid: 2\ndata: tw', true)
  const streaming = (retry?: Parameters<typeof createClient>[0]['retry']) => createClient({ baseURL, mediaTypes: streamMediaTypes, retry })

  test('reopens a stream the server cuts, from the last complete event ID', async () => {
    const { url, hits } = plan(cut(), events('id: 2\ndata: two\n\n'))

    const result = await streaming(fast).stream({ method: 'GET', url })
    expect(await collect(result)).toStrictEqual([one, two])
    expect(hits.map((hit) => hit.headers['last-event-id'])).toStrictEqual([undefined, '1'])
    expect(result.lastEventId).toBe('2')
  })

  test('reopens a cut stream of a call with a signal and of a custom axios instance', async () => {
    const signaled = plan(cut(), events('id: 2\ndata: two\n\n'))
    const result = await streaming(fast).stream({ method: 'GET', url: signaled.url, signal: new AbortController().signal })
    expect(await collect(result)).toStrictEqual([one, two])
    expect(signaled.hits.map((hit) => hit.headers['last-event-id'])).toStrictEqual([undefined, '1'])

    const custom = plan(cut(), events('id: 2\ndata: two\n\n'))
    const client = createClient({ baseURL, mediaTypes: streamMediaTypes, retry: fast, transport: createAxiosTransport(axios.create({ adapter: 'fetch' })) })
    expect(await collect(await client.stream({ method: 'GET', url: custom.url }))).toStrictEqual([one, two])
    expect(custom.hits.map((hit) => hit.headers['last-event-id'])).toStrictEqual([undefined, '1'])
  })
})
