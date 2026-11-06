import { describe, expect, test, vi } from 'vitest'
import { type EventStreamCall, parseEventStream, type ServerSentEvent, toEventStream } from './sse.ts'
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

function call({ data, contentType = 'text/event-stream' }: { data: unknown; contentType?: string }): EventStreamCall<Response> {
  return { data, contentType, response: new Response() }
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

  test('throws when a comment line alone outgrows maxEventSize', async () => {
    await expect(collect(parseEventStream({ stream: streamOf([': too long\ndata: a\n\n']), maxEventSize: 8 }))).rejects.toThrow(RangeError)
  })

  test('strips a byte order mark', async () => {
    expect(await collect(parseEventStream<string>({ stream: streamOf(['\uFEFFdata: a\n\n']) }))).toStrictEqual([message({ data: 'a' })])
  })

  test('strips a byte order mark split across chunks', async () => {
    const bytes = encoder.encode('\uFEFFdata: a\n\n')
    async function* split() {
      yield bytes.slice(0, 2)
      yield bytes.slice(2)
    }

    expect(await collect(parseEventStream<string>({ stream: split() }))).toStrictEqual([message({ data: 'a' })])
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

describe('toEventStream', () => {
  const validator: StandardSchemaValidator = {
    '~standard': {
      validate: (value) =>
        typeof value === 'object' && value !== null && ('n' in value || 'event' in value)
          ? { value: { ...value, checked: true } }
          : { issues: [{ message: 'not an object' }] },
    },
  }

  test('passes maxEventSize to the parser and exposes the response', async () => {
    const response = new Response()
    const result = await toEventStream(Promise.resolve({ ...call({ data: streamOf([`data: ${'x'.repeat(44)}\n\n`]) }), response }), {
      config: { maxEventSize: 49 },
    })

    expect(result.response).toBe(response)
    await expect(collect(result.stream)).rejects.toThrow(RangeError)
  })

  test('yields nothing for a missing body', async () => {
    expect(await collect((await toEventStream(Promise.resolve(call({ data: undefined })))).stream)).toStrictEqual([])
  })

  test.each([
    ['a stream labeled text/plain', call({ data: streamOf(['data: a\n\n']), contentType: 'text/plain' })],
    ['a stream without a content type', { data: streamOf(['data: a\n\n']), response: new Response() }],
  ])('parses %s as an event stream', async (_, first) => {
    expect(await collect((await toEventStream(Promise.resolve(first))).stream)).toStrictEqual([message({ data: 'a' })])
  })

  test('throws a TypeError with the body as cause for a successful answer that is not a stream', async () => {
    const result = toEventStream(Promise.resolve({ data: { message: 'queued' }, status: 200, contentType: 'application/json', response: new Response() }))

    await expect(result).rejects.toThrow(TypeError)
    await expect(result).rejects.toMatchObject({ cause: { message: 'queued' } })
  })

  test('accepts a content type with parameters', async () => {
    const first = call({ data: streamOf(['data: a\n\n']), contentType: 'Text/Event-Stream; charset=utf-8' })

    expect(await collect((await toEventStream<string>(Promise.resolve(first))).stream)).toStrictEqual([message({ data: 'a' })])
  })

  test('keeps the status and error of a failed call made with throwOnError false', async () => {
    const response = new Response(null, { status: 503 })
    const result = await toEventStream<string>(
      Promise.resolve({ data: undefined, error: { message: 'busy' }, status: 503, contentType: 'application/json', response }),
    )

    expect({ status: result.status, error: result.error, data: result.data, response: result.response }).toStrictEqual({
      status: 503,
      error: { message: 'busy' },
      data: undefined,
      response,
    })
    expect(await collect(result)).toStrictEqual([])
  })

  test('leaves data undefined for a failed call whose error body is empty', async () => {
    const result = await toEventStream<string>(
      Promise.resolve({ data: undefined, error: undefined, status: 503, response: new Response(null, { status: 503 }) }),
    )

    expect({ status: result.status, error: result.error, data: result.data }).toStrictEqual({ status: 503, error: undefined, data: undefined })
  })

  test('iterates the result as its stream', async () => {
    const result = await toEventStream<string>(Promise.resolve(call({ data: streamOf(['data: a\n\n', 'data: b\n\n']) })))

    expect(result.data).toBe(result.stream)
    expect(await collect(result)).toStrictEqual([message({ data: 'a' }), message({ data: 'b' })])
  })

  test('runs transform before the validator and validates data for the data shape', async () => {
    const transform = vi.fn((event: ServerSentEvent) => ({ ...event, data: { n: (event.data as { count: number }).count } }))
    const { stream } = await toEventStream(Promise.resolve(call({ data: streamOf(['id: 9\ndata: {"count":1}\n\n']) })), {
      config: { transform },
      shape: 'data',
      validator,
    })

    expect(await collect(stream)).toStrictEqual([message({ data: { n: 1, checked: true }, id: '9' })])
    expect(transform).toHaveBeenCalledOnce()
  })

  test('validates the whole event for the event shape and keeps id and retry', async () => {
    const { stream } = await toEventStream(Promise.resolve(call({ data: streamOf(['event: n\nid: 1\nretry: 5\ndata: 1\n\n']) })), {
      shape: 'event',
      validator,
    })

    expect(await collect(stream)).toStrictEqual([{ data: 1, event: 'n', id: '1', retry: 5, checked: true }])
  })

  test('a failing validation calls onValidationError and keeps streaming when it is handled', async () => {
    const onValidationError = vi.fn((_error: ParseError, context: { value: unknown }) => ({ value: { replaced: context.value } }))
    const first = call({ data: streamOf(['data: {"n":1}\n\ndata: "bad"\n\ndata: {"n":2}\n\n']) })
    const { stream } = await toEventStream(Promise.resolve(first), { config: { onValidationError }, validator })

    expect(await collect(stream)).toStrictEqual([
      message({ data: { n: 1, checked: true } }),
      message({ data: { replaced: 'bad' } }),
      message({ data: { n: 2, checked: true } }),
    ])
    expect(onValidationError).toHaveBeenCalledOnce()
    expect(onValidationError.mock.calls[0]![0]).toBeInstanceOf(ParseError)
    expect(onValidationError.mock.calls[0]![1]).toMatchObject({ direction: 'response', source: 'body', value: 'bad' })
  })

  test('a failing validation ends the stream when no handler takes it', async () => {
    const { stream } = await toEventStream(Promise.resolve(call({ data: streamOf(['data: "bad"\n\n']) })), {
      config: { onValidationError: () => undefined },
      validator,
    })

    await expect(collect(stream)).rejects.toBeInstanceOf(ParseError)
  })

  test('reads validate and onValidationError from the client when the call does not set them', async () => {
    const onValidationError = vi.fn(() => ({ value: 'replaced' }))
    const client = { getConfig: () => ({ onValidationError }) }
    const { stream } = await toEventStream(Promise.resolve(call({ data: streamOf(['data: "bad"\n\n']) })), { client, validator })
    expect(await collect(stream)).toStrictEqual([message({ data: 'replaced' })])

    const skipped = { getConfig: () => ({ validate: false }) }
    const { stream: unvalidated } = await toEventStream(Promise.resolve(call({ data: streamOf(['data: "bad"\n\n']) })), { client: skipped, validator })
    expect(await collect(unvalidated)).toStrictEqual([message({ data: 'bad' })])
  })

  test.each([false, { response: false }])('validate %o skips the validator', async (validate) => {
    const { stream } = await toEventStream(Promise.resolve(call({ data: streamOf(['data: "bad"\n\n']) })), { config: { validate }, validator })
    expect(await collect(stream)).toStrictEqual([message({ data: 'bad' })])
  })

  test('cancels the reader when the consumer breaks', async () => {
    const cancel = vi.fn()

    for await (const _event of (await toEventStream(Promise.resolve(call({ data: endless(cancel) })))).stream) break
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('cancels the reader when an event fails to process', async () => {
    const cancel = vi.fn()
    const transform = () => {
      throw new Error('boom')
    }

    await expect(collect((await toEventStream(Promise.resolve(call({ data: endless(cancel) })), { config: { transform } })).stream)).rejects.toThrow('boom')
    expect(cancel).toHaveBeenCalledOnce()
  })
})
