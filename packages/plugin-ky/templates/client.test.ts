import http from 'node:http'
import type { AddressInfo } from 'node:net'
import ky from 'ky'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { streamMediaTypes } from '../../plugin-client/templates/sse.ts'
import { client, createClient, createKyTransport, ResponseError } from './client.ts'
import type { NativeOptions } from './client.ts'

type Hit = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string }

const hits: Array<Hit> = []
// How many events each stream URL had written when its connection closed.
const closedAfter = new Map<string, number>()
let baseURL = ''

// `/flaky` answers 503 once and then 200, `/down` always answers 503, `/missing` answers 404, `/slow` never answers, and the rest echoes 200.
const server = http.createServer((req, res) => {
  const chunks: Array<Buffer> = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    hits.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() })
    const count = hits.filter((hit) => hit.url === req.url).length
    if (req.url === '/slow') return
    // Sends the headers at once and then one event every 60 ms.
    if (req.url?.startsWith('/events')) {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      res.flushHeaders()
      let sent = 0
      const timer = setInterval(() => {
        res.write(`id: ${++sent}\ndata: {"n":${sent}}\n\n`)
        if (sent === 3) {
          clearInterval(timer)
          res.end()
        }
      }, 60)
      res.on('close', () => {
        clearInterval(timer)
        closedAfter.set(req.url!, sent)
      })
      return
    }
    const status = req.url === '/missing' ? 404 : req.url?.startsWith('/down') || (req.url === '/flaky' && count === 1) ? 503 : 200
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(status === 200 ? { ok: true } : { message: 'nope' }))
  })
})

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  baseURL = `http://localhost:${(server.address() as AddressInfo).port}`
  client.setConfig({ baseURL })
})

afterAll(() => {
  server.closeAllConnections()
  server.close()
})

describe('defaultTransport', () => {
  test('sends the resolved request with Ky and decodes the JSON answer', async () => {
    const result = await client({ method: 'POST', url: '/pets', headers: { 'X-Test': '1' }, body: { name: 'Odie' } })

    expect(result.data).toEqual({ ok: true })
    expect(result.status).toBe(200)
    expect(result.response).toBeInstanceOf(Response)
    expect(hits.at(-1)).toMatchObject({ method: 'POST', url: '/pets', body: '{"name":"Odie"}', headers: { 'x-test': '1', 'content-type': 'application/json' } })
  })

  test('resolves an error status with its body unread, so the core throws a ResponseError with the decoded body', async () => {
    const error = await client({ method: 'GET', url: '/missing' }).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(ResponseError)
    expect(error).toMatchObject({ status: 404, data: { message: 'nope' } })
  })

  test('returns an error status as a value with throwOnError: false', async () => {
    const result = await client({ method: 'GET', url: '/missing', throwOnError: false })

    expect(result.error).toEqual({ message: 'nope' })
    expect(result.response.status).toBe(404)
  })

  test('passes Ky options from the call, such as timeout and hooks', async () => {
    const seen: Array<string> = []
    await client({ method: 'GET', url: '/hooked', options: { hooks: { beforeRequest: [({ request }: { request: Request }) => void seen.push(request.url)] } } })

    expect(seen).toEqual([`${baseURL}/hooked`])
    await expect(client({ method: 'GET', url: '/slow', options: { timeout: 50, retry: 0 } })).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  test('does not retry an error status or a network error, as the fetch and axios clients do not', async () => {
    await expect(client({ method: 'GET', url: '/down' })).rejects.toMatchObject({ status: 503, data: { message: 'nope' } })
    expect(hits.filter((hit) => hit.url === '/down')).toHaveLength(1)

    const retries = vi.fn()
    const options = { hooks: { beforeRetry: [retries] } }
    await expect(client({ method: 'GET', url: '/x', baseURL: 'http://127.0.0.1:1', options })).rejects.toMatchObject({ name: 'NetworkError' })
    expect(retries).not.toHaveBeenCalled()
  })

  test('retries when options ask for it: a network error by retry, an error status by an afterResponse hook', async () => {
    const retries = vi.fn()
    const retry = { limit: 2, delay: () => 0 }
    await expect(
      client({ method: 'GET', url: '/x', baseURL: 'http://127.0.0.1:1', options: { retry, hooks: { beforeRetry: [retries] } } }),
    ).rejects.toMatchObject({ name: 'NetworkError' })
    expect(retries).toHaveBeenCalledTimes(2)

    // The hook from the calling-operations guide: stop at the limit, so the last response reaches the core.
    const hooks: NativeOptions['hooks'] = {
      afterResponse: [({ response, retryCount, options }) => (response.status === 503 && retryCount < options.retry.limit ? ky.retry() : undefined)],
    }
    expect((await client({ method: 'GET', url: '/flaky', options: { retry, hooks } })).status).toBe(200)
    expect(hits.filter((hit) => hit.url === '/flaky')).toHaveLength(2)

    await expect(client({ method: 'GET', url: '/down-hooked', options: { retry, hooks } })).rejects.toMatchObject({ status: 503, data: { message: 'nope' } })
    expect(hits.filter((hit) => hit.url === '/down-hooked')).toHaveLength(3)
  })

  test('rejects an aborted call with the signal reason', async () => {
    const reason = new Error('stop')

    await expect(client({ method: 'GET', url: '/slow', signal: AbortSignal.abort(reason) })).rejects.toBe(reason)
  })
})

describe('createKyTransport', () => {
  test('keeps the defaults of the Ky instance', async () => {
    const own = createClient({ baseURL, transport: createKyTransport(ky.create({ headers: { 'X-Instance': 'yes' } })) })

    await own({ method: 'GET', url: '/instance' })

    expect(hits.at(-1)?.headers['x-instance']).toBe('yes')
  })

  test('runs the instance hooks before the hooks in options, and the hooks of a call replace the client hooks', async () => {
    const seen: Array<string> = []
    const hook = (name: string) => () => void seen.push(name)
    const own = createClient({
      baseURL,
      transport: createKyTransport(ky.create({ hooks: { beforeRequest: [hook('instance')] } })),
      options: { hooks: { beforeRequest: [hook('client')] } },
    })
    own.interceptors.request.use((request) => (seen.push('interceptor'), request))

    await own({ method: 'GET', url: '/order' })
    await own({ method: 'GET', url: '/order', options: { hooks: { beforeRequest: [hook('call')] } } })

    expect(seen).toStrictEqual(['interceptor', 'instance', 'client', 'interceptor', 'instance', 'call'])
  })
})

describe('client.stream', () => {
  const streamClient = () => createClient({ baseURL, mediaTypes: streamMediaTypes, options: { timeout: 50 } })

  test('reads server-sent events past the Ky timeout, which only waits for the headers', async () => {
    const events = await streamClient().stream<{ '200': { n: number } }>({ method: 'GET', url: '/events' })
    const seen: Array<unknown> = []
    for await (const event of events) seen.push(event.data)

    expect(seen).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }])
    expect(hits.filter((hit) => hit.url === '/events')).toHaveLength(1)
    expect(hits.at(-1)?.headers.accept).toBe('text/event-stream')
  })

  test('stops the request when the loop breaks', async () => {
    const events = await streamClient().stream<{ '200': { n: number } }>({ method: 'GET', url: '/events-break' })
    const seen: Array<unknown> = []
    for await (const event of events) {
      seen.push(event.data)
      break
    }

    expect(seen).toStrictEqual([{ n: 1 }])
    await vi.waitFor(() => expect(closedAfter.has('/events-break')).toBe(true))
    expect(closedAfter.get('/events-break')).toBeLessThan(3)
  })

  test('rejects with the signal reason when the abort comes while events are read', async () => {
    const controller = new AbortController()
    const reason = new Error('stop')
    const events = await streamClient().stream({ method: 'GET', url: '/events-abort', signal: controller.signal })
    const read = (async () => {
      for await (const _ of events) controller.abort(reason)
    })()

    await expect(read).rejects.toBe(reason)
  })
})
