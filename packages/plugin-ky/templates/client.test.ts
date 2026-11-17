import http from 'node:http'
import type { AddressInfo } from 'node:net'
import ky from 'ky'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { client, createClient, createKyTransport, ResponseError } from './client.ts'

type Hit = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string }

const hits: Array<Hit> = []
let baseURL = ''

// `/flaky` answers 503 once and then 200, `/down` always answers 503, `/missing` answers 404, `/slow` never answers, and the rest echoes 200.
const server = http.createServer((req, res) => {
  const chunks: Array<Buffer> = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    hits.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() })
    const count = hits.filter((hit) => hit.url === req.url).length
    if (req.url === '/slow') return
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
    await client({ method: 'GET', url: '/hooked', options: { hooks: { beforeRequest: [({ request }) => void seen.push(request.url)] } } })

    expect(seen).toEqual([`${baseURL}/hooked`])
    await expect(client({ method: 'GET', url: '/slow', options: { timeout: 50, retry: 0 } })).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  test('rejects an aborted call with the signal reason', async () => {
    const reason = new Error('stop')

    await expect(client({ method: 'GET', url: '/slow', signal: AbortSignal.abort(reason) })).rejects.toBe(reason)
  })
})

describe('createKyTransport', () => {
  test('keeps the defaults and hooks of the Ky instance, and retries a status by its retry options', async () => {
    const instance = ky.create({
      headers: { 'X-Instance': 'yes' },
      retry: { limit: 2, delay: () => 0 },
    })
    const flaky = createClient({ baseURL, transport: createKyTransport(instance) })

    const result = await flaky({ method: 'GET', url: '/flaky' })

    expect(result.status).toBe(200)
    expect(hits.filter((hit) => hit.url === '/flaky')).toHaveLength(2)
    expect(hits.at(-1)?.headers['x-instance']).toBe('yes')

    // Past the retry limit, the last response reaches the core, which throws its ResponseError.
    await expect(flaky({ method: 'GET', url: '/down' })).rejects.toMatchObject({ status: 503, data: { message: 'nope' } })
    expect(hits.filter((hit) => hit.url === '/down')).toHaveLength(3)

    // Ky leaves a POST out of its retry methods, and `retry: 0` turns retries off.
    await expect(flaky({ method: 'POST', url: '/down-post' })).rejects.toMatchObject({ status: 503 })
    await expect(flaky({ method: 'GET', url: '/down-once', options: { retry: 0 } })).rejects.toMatchObject({ status: 503 })
    expect(hits.filter((hit) => hit.url?.startsWith('/down-'))).toHaveLength(2)
  })
})
