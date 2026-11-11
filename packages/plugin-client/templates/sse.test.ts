import { describe, expect, test, vi } from 'vitest'
import { type ClientConfig, createClientCore, type EventStreamOptions, type RequestConfig, type ServerSentEvent } from './core.ts'
import { parseEventStream, parseJsonLines, streamMediaTypes } from './sse.ts'
import { ParseError, type StandardSchemaValidator } from './standardSchema.ts'

const encoder = new TextEncoder()

function streamOf(chunks: Array<string>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

function endless(cancel: () => void): ReadableStream<Uint8Array> {
  return new ReadableStream({ pull: (controller) => controller.enqueue(encoder.encode('data: a\n\n')), cancel })
}

async function* asyncIterableOf(chunks: Array<string>): AsyncGenerator<Uint8Array> {
  for (const chunk of chunks) yield encoder.encode(chunk)
}

async function collect<T>(stream: AsyncIterable<T>): Promise<Array<T>> {
  const items: Array<T> = []
  for await (const item of stream) items.push(item)
  return items
}

const message = <TData>({ data, ...rest }: { data: TData } & Partial<Omit<ServerSentEvent, 'data'>>): ServerSentEvent<TData> => ({
  data,
  event: 'message',
  ...rest,
})

describe('parseEventStream', () => {
  test('dispatches an event at its blank line and drops an unfinished event at the end of the stream', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['data: a\n\ndata: b']) }))).toStrictEqual([message({ data: 'a' })])
  })

  test('sets the last event ID from a block without data but dispatches nothing for it', async () => {
    const cursor = { lastEventId: '' }
    const events = await collect(parseEventStream<string>({ stream: streamOf(['event: x\nid: 7\n\ndata: a\n\n']), cursor }))

    expect(events).toStrictEqual([message({ data: 'a', id: '7' })])
    expect(cursor.lastEventId).toBe('7')
  })

  test('commits the last event ID at the blank line, not when the id line is read', async () => {
    const cursor = { lastEventId: '' }
    const events = await collect(parseEventStream<string>({ stream: streamOf(['id: 1\ndata: a\n\nid: 2\ndata: half']), cursor }))

    expect(events).toStrictEqual([message({ data: 'a', id: '1' })])
    expect(cursor.lastEventId).toBe('1')
  })

  test('reads retry only when it is all ASCII digits', async () => {
    const events = await collect(
      parseEventStream<string>({ stream: streamOf(['retry:\ndata: a\n\nretry: 1e3\ndata: b\n\nretry: -5\ndata: c\n\nretry: 1000\ndata: d\n\n']) }),
    )

    expect(events).toStrictEqual([message({ data: 'a' }), message({ data: 'b' }), message({ data: 'c' }), message({ data: 'd', retry: 1000 })])
  })

  test('carries the last event ID across events until an empty id resets it', async () => {
    const events = await collect(parseEventStream<string>({ stream: streamOf(['id: 1\ndata: a\n\ndata: b\n\nid:\ndata: c\n\n']) }))

    expect(events).toStrictEqual([message({ data: 'a', id: '1' }), message({ data: 'b', id: '1' }), message({ data: 'c' })])
  })

  test('ignores an id that contains NULL', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['id: a\u0000b\ndata: a\n\n']) }))).toStrictEqual([message({ data: 'a' })])
  })

  test('defaults the event name to message and keeps a sent one', async () => {
    const events = await collect(parseEventStream({ stream: streamOf(['data: {"n":1}\n\nevent: ping\ndata: {"n":2}\n\n']) }))

    expect(events).toStrictEqual([message({ data: { n: 1 } }), { data: { n: 2 }, event: 'ping' }])
  })

  test('joins data lines when a CRLF falls across two reads', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['data: a\r', '\ndata: b\r\n\r\n']) }))).toStrictEqual([message({ data: 'a\nb' })])
  })

  test.each([
    ['a comment-only block', ': heartbeat\n\ndata: a\n\n', [message({ data: 'a' })]],
    ['data:test and data: test', 'data:test\n\ndata: test\n\n', [message({ data: 'test' }), message({ data: 'test' })]],
    ['a bare data field and a two-line empty data', 'data\n\ndata\ndata\n\ndata:', [message({ data: '' }), message({ data: '\n' })]],
  ])('follows the specification example with %s', async (_, text, expected) => {
    expect(await collect(parseEventStream<string>({ stream: streamOf([text]) }))).toStrictEqual(expected)
  })

  test('ignores unknown fields and keeps the last retry of a block', async () => {
    const events = await collect(parseEventStream<string>({ stream: streamOf(['retry: 1000\nretry: 2000\nunknown: ignored\ndata: ok\n\n']) }))

    expect(events).toStrictEqual([message({ data: 'ok', retry: 2000 })])
  })

  test('parses JSON data and keeps other data as a string', async () => {
    const events = await collect(parseEventStream({ stream: streamOf(['data: {"n":1}\n\n', 'data: hello world\n\n']) }))

    expect(events).toStrictEqual([message({ data: { n: 1 } }), message({ data: 'hello world' })])
  })

  test('keeps every data as text with rawData', async () => {
    const events = await collect(parseEventStream({ stream: streamOf(['data: hello\n\ndata: 42\n\ndata: true\n\n']), rawData: true }))

    expect(events).toStrictEqual([message({ data: 'hello' }), message({ data: '42' }), message({ data: 'true' })])
  })

  test('reassembles an event split across chunks', async () => {
    expect(await collect(parseEventStream({ stream: streamOf(['data: {"hal', 'f":true}\n\n']) }))).toStrictEqual([message({ data: { half: true } })])
  })

  test('reads an async iterable of chunks', async () => {
    expect(await collect(parseEventStream({ stream: asyncIterableOf(['data: {"n":1}\n\n']) }))).toStrictEqual([message({ data: { n: 1 } })])
  })

  test('accepts a lone CR as a line break', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['data: a\rdata: b\r\rdata: c\r\r']) }))).toStrictEqual([
      message({ data: 'a\nb' }),
      message({ data: 'c' }),
    ])
  })

  test('joins a CRLF split across an empty chunk', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['data: a\r', '', '\ndata: b\n\n']) }))).toStrictEqual([message({ data: 'a\nb' })])
  })

  test('drops comment lines without counting them toward maxEventSize', async () => {
    const events = await collect(parseEventStream<string>({ stream: streamOf([': keep alive!!\ndata: a\n\n']), maxEventSize: 20 }))

    expect(events).toStrictEqual([message({ data: 'a' })])
  })

  test('measures an unfinished comment line on its own at a chunk boundary', async () => {
    const events = await collect(parseEventStream<string>({ stream: streamOf(['data: abcdefghi\n', ': keep alive', '\n\n']), maxEventSize: 20 }))

    expect(events).toStrictEqual([message({ data: 'abcdefghi' })])
  })

  test('strips a byte order mark', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['\uFEFFdata: a\n\n']) }))).toStrictEqual([message({ data: 'a' })])
  })

  test('decodes a multi-byte character split across chunks', async () => {
    const bytes = encoder.encode('data: ✓\n\n')
    async function* split() {
      yield bytes.slice(0, 7)
      yield bytes.slice(7)
    }

    expect(await collect(parseEventStream<string>({ stream: split() }))).toStrictEqual([message({ data: '✓' })])
  })

  test('ends the stream at the terminator and cancels the reader', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"n":1}\n\ndata: [DONE]\n\ndata: {"n":2}\n\n'))
      },
      cancel,
    })

    expect(await collect(parseEventStream({ stream: stream, terminator: '[DONE]' }))).toStrictEqual([message({ data: { n: 1 } })])
    expect(cancel).toHaveBeenCalledOnce()
  })

  test.each([
    ['one unfinished line', 'x'.repeat(1024)],
    ['one unfinished multi-line event', `data: ${'x'.repeat(1024)}\n`],
  ])('cancels the stream when %s outgrows maxEventSize', async (_, chunk) => {
    const bytes = encoder.encode(chunk)
    const cancel = vi.fn()
    const endless = new ReadableStream<Uint8Array>({ pull: (controller) => controller.enqueue(bytes), cancel })

    await expect(collect(parseEventStream({ stream: endless, maxEventSize: 64 * 1024 }))).rejects.toStrictEqual(
      new RangeError('Server-sent event exceeds maxEventSize of 65536 characters'),
    )
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('applies maxEventSize to an event in one chunk and to a comment line', async () => {
    const chunk = `data: ${'x'.repeat(44)}\n\n`
    expect(await collect(parseEventStream<string>({ stream: streamOf([chunk]), maxEventSize: 51 }))).toStrictEqual([message({ data: 'x'.repeat(44) })])
    await expect(collect(parseEventStream({ stream: streamOf([chunk]), maxEventSize: 50 }))).rejects.toThrow(RangeError)
    await expect(collect(parseEventStream({ stream: streamOf([`: ${'x'.repeat(30)}`, `${'x'.repeat(30)}\ndata: a\n\n`]), maxEventSize: 50 }))).rejects.toThrow(
      RangeError,
    )
  })
})

describe('parseJsonLines', () => {
  test('yields one value per line across CRLF, CR, LF, blank lines, and a last line without a line break', async () => {
    const stream = streamOf(['{"n":1}\r\n\r\n[2]\r', '\n"three"\n', '\n4'])

    expect(await collect(parseJsonLines({ stream }))).toStrictEqual([{ n: 1 }, [2], 'three', 4])
  })

  test('joins a line split across chunks, a multibyte character included', async () => {
    const bytes = encoder.encode('{"name":"é"}\n')
    async function* split() {
      yield bytes.slice(0, 4)
      yield bytes.slice(4, 10)
      yield bytes.slice(10)
    }

    expect(await collect(parseJsonLines({ stream: split() }))).toStrictEqual([{ name: 'é' }])
  })

  test('drops the json-seq record separator and stops at the terminator', async () => {
    const stream = streamOf(['\u001e{"n":1}\n\u001e{"n":2}\n[DONE]\n{"n":3}\n'])

    expect(await collect(parseJsonLines({ stream, terminator: '[DONE]' }))).toStrictEqual([{ n: 1 }, { n: 2 }])
  })

  test('throws a SyntaxError for a line that is not JSON', async () => {
    await expect(collect(parseJsonLines({ stream: streamOf(['{"n":1}\nnot json\n']) }))).rejects.toThrow(SyntaxError)
  })

  test.each([
    ['a finished line', ['[1]\n', `"${'x'.repeat(20)}"\n`]],
    ['an unfinished line', ['[1]\n', `"${'x'.repeat(30)}`]],
  ])('throws a RangeError for %s past maxEventSize', async (_, chunks) => {
    await expect(collect(parseJsonLines({ stream: streamOf(chunks), maxEventSize: 20 }))).rejects.toThrow(RangeError)
  })
})

describe('streamMediaTypes', () => {
  const validator: StandardSchemaValidator = {
    '~standard': {
      validate: (value) =>
        typeof value === 'object' && value !== null && ('n' in value || 'event' in value)
          ? { value: { ...value, checked: true } }
          : { issues: [{ message: 'not an object' }] },
    },
  }

  function stream(
    body: ReadableStream<Uint8Array> | null,
    {
      contentType = 'text/event-stream',
      status = 200,
      client = {},
      ...config
    }: Omit<RequestConfig, 'method' | 'url'> & EventStreamOptions & { contentType?: string; status?: number; client?: ClientConfig<unknown, unknown> } = {},
  ) {
    const response = new Response(body, { status, headers: { 'content-type': contentType } })
    const instance = createClientCore<unknown, unknown>({ defaultTransport: async () => response, mediaTypes: streamMediaTypes, ...client })
    return instance.stream({ method: 'GET', url: '/events', eventShape: 'data', ...config })
  }

  test('passes maxEventSize to the parser and exposes the response', async () => {
    const result = await stream(streamOf([`data: ${'x'.repeat(44)}\n\n`]), { maxEventSize: 49 })

    expect(result.response).toBeInstanceOf(Response)
    await expect(collect(result.stream)).rejects.toThrow(RangeError)
  })

  test('yields nothing for a missing body', async () => {
    expect(await collect((await stream(null, { status: 204 })).stream)).toStrictEqual([])
  })

  test('accepts a content type with parameters', async () => {
    const result = await stream(streamOf(['data: a\n\n']), { contentType: 'Text/Event-Stream; charset=utf-8' })
    expect(await collect(result.stream)).toStrictEqual([message({ data: 'a' })])
  })

  test('iterates the result as its stream', async () => {
    const result = await stream(streamOf(['data: a\n\n', 'data: b\n\n']))

    expect(result.data).toBe(result.stream)
    expect(await collect(result)).toStrictEqual([message({ data: 'a' }), message({ data: 'b' })])
  })

  test('runs transform before the validator and validates data for the data shape', async () => {
    const transform = (event: ServerSentEvent) => ({ ...event, data: { n: event.data } })
    const result = await stream(streamOf(['data: 1\n\n']), { transform, validator: { response: validator } })
    expect(await collect(result)).toStrictEqual([message({ data: { n: 1, checked: true } })])
  })

  test('passes rawData to the parser, so a string validator sees the text', async () => {
    const isString: StandardSchemaValidator = {
      '~standard': { validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'not a string' }] }) },
    }
    const result = await stream(streamOf(['data: hello\n\ndata: 42\n\n']), { rawData: true, validator: { response: isString } })
    expect(await collect(result)).toStrictEqual([message({ data: 'hello' }), message({ data: '42' })])
  })

  test('validates the whole event for the event shape and keeps id and retry', async () => {
    const result = await stream(streamOf(['id: 7\nretry: 10\nevent: ping\ndata: 1\n\n']), { eventShape: 'event', validator: { response: validator } })
    expect(await collect(result)).toStrictEqual([{ data: 1, event: 'ping', id: '7', retry: 10, checked: true }])
  })

  test.each(['application/jsonl', 'application/x-ndjson', 'application/json-seq', 'application/geo+json-seq'])(
    'reads %s as JSON Lines, validates each line, and skips transform',
    async (contentType) => {
      const transform = vi.fn((event: ServerSentEvent) => event)
      const result = await stream(streamOf(['{"n":1}\n{"n":2}\n']), { contentType, eventShape: undefined, transform, validator: { response: validator } })
      expect(await collect(result)).toStrictEqual([
        { n: 1, checked: true },
        { n: 2, checked: true },
      ])
      expect(transform).not.toHaveBeenCalled()
    },
  )

  test('a failing validation calls onValidationError and keeps streaming when it is handled', async () => {
    const onValidationError = vi.fn((_error: ParseError, context: { value: unknown }) => ({ value: { replaced: context.value } }))
    const result = await stream(streamOf(['data: {"n":1}\n\ndata: "bad"\n\ndata: {"n":2}\n\n']), { onValidationError, validator: { response: validator } })

    expect(await collect(result)).toStrictEqual([
      message({ data: { n: 1, checked: true } }),
      message({ data: { replaced: 'bad' } }),
      message({ data: { n: 2, checked: true } }),
    ])
    expect(onValidationError).toHaveBeenCalledOnce()
    expect(onValidationError.mock.calls[0]![0]).toBeInstanceOf(ParseError)
    expect(onValidationError.mock.calls[0]![1]).toMatchObject({ direction: 'response', source: 'body', value: 'bad' })
  })

  test('a failing validation ends the stream when no handler takes it', async () => {
    const result = await stream(streamOf(['data: "bad"\n\n']), { onValidationError: () => undefined, validator: { response: validator } })
    await expect(collect(result)).rejects.toBeInstanceOf(ParseError)
  })

  test('reads validate and onValidationError from the client when the call does not set them', async () => {
    const onValidationError = vi.fn(() => ({ value: 'replaced' }))
    const handled = await stream(streamOf(['data: "bad"\n\n']), { client: { onValidationError }, validator: { response: validator } })
    expect(await collect(handled)).toStrictEqual([message({ data: 'replaced' })])

    const skipped = await stream(streamOf(['data: "bad"\n\n']), { client: { validate: false }, validator: { response: validator } })
    expect(await collect(skipped)).toStrictEqual([message({ data: 'bad' })])
  })

  test.each([false, { response: false }])('validate %o skips the validator', async (validate) => {
    const result = await stream(streamOf(['data: "bad"\n\n']), { validate, validator: { response: validator } })
    expect(await collect(result)).toStrictEqual([message({ data: 'bad' })])
  })

  test('ends the loop with the abort reason once the signal is aborted, before the next event of the same chunk', async () => {
    const controller = new AbortController()
    const cancel = vi.fn()
    const body = new ReadableStream({ start: (c) => c.enqueue(encoder.encode('id: 1\ndata: a\n\nid: 2\ndata: b\n\n')), cancel })
    const result = await stream(body, { signal: controller.signal })
    const seen: Array<unknown> = []

    const error = await (async () => {
      for await (const event of result.stream) {
        seen.push(event)
        controller.abort(new Error('stop'))
      }
    })().catch((e: unknown) => e)

    expect(seen).toStrictEqual([message({ data: 'a', id: '1' })])
    expect(error).toStrictEqual(new Error('stop'))
    expect(result.lastEventId).toBe('1')
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('rejects with the abort reason when the transport fails the read with its own error', async () => {
    const controller = new AbortController()
    const body = new ReadableStream({
      pull: (c) => {
        controller.abort(new Error('stop'))
        c.error(new Error('CanceledError'))
      },
    })
    const result = await stream(body, { signal: controller.signal })

    await expect(collect(result.stream)).rejects.toStrictEqual(new Error('stop'))
  })

  test('cancels the reader when the consumer breaks', async () => {
    const cancel = vi.fn()

    for await (const _event of (await stream(endless(cancel))).stream) break
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('cancels the reader when an event fails to process', async () => {
    const cancel = vi.fn()
    const transform = () => {
      throw new Error('boom')
    }

    await expect(collect((await stream(endless(cancel), { transform })).stream)).rejects.toThrow('boom')
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('reads a whole body as text, as an error body is', async () => {
    const decode = streamMediaTypes['text/event-stream']?.decode
    expect(await decode?.(new Response('data: a\n\n'), { contentType: 'text/event-stream', config: {} })).toBe('data: a\n\n')
  })
})
