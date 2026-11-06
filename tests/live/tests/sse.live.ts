import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import * as wikiFetch from '../gen/wikimedia-fetch/index.ts'
import * as wikiAxios from '../gen/wikimedia-axios/index.ts'
import * as localFetch from '../gen/local-sse-fetch/index.ts'
import * as localAxios from '../gen/local-sse-axios/index.ts'
import type { ServerSentEvent } from '../gen/wikimedia-fetch/.kubb/sse.ts'
import type { RecentChange } from '../gen/wikimedia-fetch/models/RecentChange.ts'
import { startSseServer } from './server.ts'

const wiki = { fetch: wikiFetch, axios: wikiAxios as unknown as typeof wikiFetch }
const local = { fetch: localFetch, axios: localAxios as unknown as typeof localFetch }

describe.each(Object.entries(wiki))('Wikimedia EventStreams over %s', (_flavor, gen) => {
  const { ResponseError } = gen
  const since = new Date(Date.now() - 10 * 60_000).toISOString()
  // Wikimedia's robot policy answers 403 to axios's default User-Agent.
  gen.client.setConfig({ headers: { 'User-Agent': 'kubb-plugins-live-test/1.0 (https://github.com/kubb-labs/plugins)' } })

  test('iterates live events, keeps the last event ID, and stops on break', async () => {
    const result = await gen.streamRecentChanges({ path: { streams: 'recentchange' }, query: { since } })
    expect(result.status).toBe(200)
    expect(result.contentType).toBe('text/event-stream')
    expect(result.error).toBeUndefined()

    const events: Array<ServerSentEvent<RecentChange>> = []
    const started = Date.now()
    for await (const event of result) {
      events.push(event)
      if (events.length === 3) break
    }
    expect(events).toHaveLength(3)
    for (const event of events) {
      expect(event.event).toBe('message')
      expect(typeof event.id).toBe('string')
      expect(JSON.parse(event.id!)[0]).toMatchObject({ topic: expect.stringContaining('mediawiki.recentchange') })
      expect(event.data.meta.dt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(typeof event.data.wiki).toBe('string')
      expect(new Date(event.data.meta.dt).getTime()).toBeGreaterThanOrEqual(new Date(since).getTime() - 1000)
    }
    expect(result.lastEventId).toBe(events[2]!.id)
    expect(Date.now() - started).toBeLessThan(20_000)
  })

  test('resumes from Last-Event-ID where the first call stopped', async () => {
    const first = await gen.streamRecentChanges({ path: { streams: 'recentchange' }, query: { since } })
    let last: ServerSentEvent<RecentChange> | undefined
    let count = 0
    for await (const event of first.stream) {
      last = event
      if (++count === 2) break
    }
    expect(first.lastEventId).toBe(last!.id)

    const resumed = await gen.streamRecentChanges({ path: { streams: 'recentchange' }, headers: { 'Last-Event-ID': first.lastEventId } })
    let next: ServerSentEvent<RecentChange> | undefined
    for await (const event of resumed.stream) {
      next = event
      break
    }
    expect(new Date(next!.data.meta.dt).getTime()).toBeGreaterThanOrEqual(new Date(last!.data.meta.dt).getTime())
  })

  test('.unwrap() resolves to the events', async () => {
    const events = await gen.streamRecentChanges({ path: { streams: 'recentchange' }, query: { since } }).unwrap()
    for await (const { data } of events) {
      expect(typeof data.wiki).toBe('string')
      break
    }
  })

  test('an unknown stream is a 400 ResponseError with the JSON error body', async () => {
    const error = await gen.streamRecentChanges({ path: { streams: 'nope' } }).catch((e: unknown) => e)
    if (!ResponseError.is(error)) throw error
    expect(error.status).toBe(400)
    expect(error.data).toMatchObject({ status: 400 })

    const result = await gen.streamRecentChanges({ path: { streams: 'nope' }, throwOnError: false })
    expect(result.status).toBe(400)
    if (result.status === 400) expect(result.error?.status).toBe(400)
    expect(result.data).toBeUndefined()
    const events: Array<unknown> = []
    for await (const event of result.stream) events.push(event)
    expect(events).toStrictEqual([])
    await expect(gen.streamRecentChanges({ path: { streams: 'nope' }, throwOnError: false }).unwrap()).rejects.toMatchObject({ status: 400 })
  })

  test('an abort mid-stream ends the loop with the abort reason and keeps lastEventId', async () => {
    const controller = new AbortController()
    const result = await gen.streamRecentChanges({ path: { streams: 'recentchange' }, query: { since }, signal: controller.signal })
    let count = 0
    const error = await (async () => {
      for await (const _event of result.stream) {
        if (++count === 2) controller.abort()
      }
    })().catch((e: unknown) => e)
    expect(count).toBe(2)
    expect(error).toBeInstanceOf(Error)
    expect(ResponseError.is(error)).toBe(false)
    expect(result.lastEventId).not.toBe('')
  })

  test('transform runs on each event before it reaches the loop', async () => {
    const result = await gen.streamRecentChanges({
      path: { streams: 'recentchange' },
      query: { since },
      transform: (event) => ({ ...event, data: { ...(event.data as RecentChange), title: 'TRANSFORMED' } }),
    })
    for await (const event of result) {
      expect(event.data.title).toBe('TRANSFORMED')
      break
    }
  })
})

describe('local SSE server', () => {
  let server: Awaited<ReturnType<typeof startSseServer>>
  beforeAll(async () => {
    server = await startSseServer()
    for (const gen of Object.values(local)) gen.client.setConfig({ baseURL: server.baseURL })
  })
  afterAll(() => server.close())

  describe.each(Object.entries(local))('over %s', (_flavor, gen) => {
    test('typed events: discriminated event names, carried id, retry, CRLF, comments, multi-line data, and [DONE]', async () => {
      const result = await gen.streamChat({ body: { prompt: 'hi' }, terminator: '[DONE]' })
      const seen: Array<string> = []
      for await (const event of result) {
        if (event.event === 'message_delta') seen.push(`delta ${event.data.text} id=${event.id} retry=${event.retry}`)
        if (event.event === 'ping') seen.push(`ping ${event.data} id=${event.id}`)
      }
      expect(seen).toStrictEqual(['delta Hel id=1 retry=undefined', 'ping keep-alive id=1', 'delta lo id=2 retry=5000'])
      expect(result.lastEventId).toBe('2')
      expect(server.requests.at(-1)?.headers.accept).toBe('text/event-stream')
      expect(server.requests.at(-1)?.headers['content-type']).toBe('application/json')
    })

    test('a 400 to a POST stream throws a ResponseError with the typed error body', async () => {
      const error = await gen.streamChat({ body: { prompt: 'bad' } }).catch((e: unknown) => e)
      if (!gen.ResponseError.is(error)) throw error
      expect(error.status).toBe(400)
      expect(error.data).toStrictEqual({ message: 'bad prompt' })

      const result = await gen.streamChat({ body: { prompt: 'bad' }, throwOnError: false })
      if (result.status === 400) expect(result.error?.message).toBe('bad prompt')
      else throw new Error(`unexpected status ${result.status}`)
    })

    test('a JSON answer to a POST stream throws a TypeError with the body as cause', async () => {
      const error = await gen.streamChat({ body: { prompt: 'json' } }).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(TypeError)
      expect((error as { cause: unknown }).cause).toStrictEqual({ answer: 'whole body' })
    })

    test('a dropped connection throws from the loop, and Last-Event-ID resumes after the last full event', async () => {
      const first = await gen.streamFeed({ query: { count: 5, drop: 3 } })
      const seen: Array<number> = []
      const error = await (async () => {
        for await (const event of first) seen.push(event.data.n)
      })().catch((e: unknown) => e)
      expect(seen).toStrictEqual([1, 2, 3])
      expect(error).toBeInstanceOf(Error)
      expect(gen.ResponseError.is(error)).toBe(false)
      expect(first.lastEventId).toBe('3')

      const resumed = await gen.streamFeed({ query: { count: 5 }, headers: { 'Last-Event-ID': first.lastEventId } })
      const rest: Array<number> = []
      for await (const event of resumed) rest.push(event.data.n)
      expect(rest).toStrictEqual([4, 5])
      expect(resumed.lastEventId).toBe('5')
    })

    test('maxEventSize throws a RangeError and cancels the stream', async () => {
      const result = await gen.streamFeed({ query: { count: 3, padding: 500 }, maxEventSize: 100 })
      const error = await (async () => {
        for await (const _event of result) {
          /* drain */
        }
      })().catch((e: unknown) => e)
      expect(error).toBeInstanceOf(RangeError)
    })

    test('a 406 from a server that negotiates the format is a ResponseError, not a hang', async () => {
      const own = gen.createClient({ headers: { Accept: 'application/json' } })
      const error = await gen.streamFeed({ query: { count: 1 }, client: own }).catch((e: unknown) => e)
      if (!gen.ResponseError.is(error)) throw error
      expect(error.status).toBe(406)
      expect(error.data).toMatchObject({ message: 'Not Acceptable: application/json' })
    })
  })
})
