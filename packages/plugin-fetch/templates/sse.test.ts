import { describe, expect, test, vi } from 'vitest'
import { type EventStreamCall, type EventStreamSend, parseEventStream, type ServerSentEvent, toEventStream } from './sse.ts'
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

/** A stream the server drops after `text`, as a lost connection does. */
function droppedAfter(text: string): ReadableStream<Uint8Array> {
  let sent = false
  return new ReadableStream({
    pull(controller) {
      if (sent) return controller.error(new Error('connection lost'))
      sent = true
      controller.enqueue(encoder.encode(text))
    },
  })
}

async function* asyncIterableOf(chunks: Array<string>): AsyncGenerator<Uint8Array> {
  for (const chunk of chunks) yield encoder.encode(chunk)
}

async function collect<T>(stream: AsyncIterable<T>): Promise<Array<T>> {
  const items: Array<T> = []
  for await (const item of stream) items.push(item)
  return items
}

function call(data: unknown, contentType = 'text/event-stream'): EventStreamCall<Response> {
  return { data, contentType, response: new Response() }
}

const message = <TData>(data: TData, rest: Partial<ServerSentEvent> = {}): ServerSentEvent<TData> => ({ data, event: 'message', ...rest })

describe('parseEventStream', () => {
  test('dispatches an event at its blank line and drops an unfinished event at the end of the stream', async () => {
    expect(await collect(parseEventStream<string>(streamOf(['data: a\n\ndata: b'])))).toStrictEqual([message('a')])
  })

  test('sets the last event ID from a block without data but dispatches nothing for it', async () => {
    const cursor = { lastEventId: '' }
    const events = await collect(parseEventStream<string>(streamOf(['event: x\nid: 7\n\ndata: a\n\n']), { cursor }))

    expect(events).toStrictEqual([message('a', { id: '7' })])
    expect(cursor.lastEventId).toBe('7')
  })

  test('reads retry only when it is all ASCII digits', async () => {
    const events = await collect(
      parseEventStream<string>(streamOf(['retry:\ndata: a\n\nretry: 1e3\ndata: b\n\nretry: -5\ndata: c\n\nretry: 1000\ndata: d\n\n'])),
    )

    expect(events).toStrictEqual([message('a'), message('b'), message('c'), message('d', { retry: 1000 })])
  })

  test('carries the last event ID across events until an empty id resets it', async () => {
    const events = await collect(parseEventStream<string>(streamOf(['id: 1\ndata: a\n\ndata: b\n\nid:\ndata: c\n\n'])))

    expect(events).toStrictEqual([message('a', { id: '1' }), message('b', { id: '1' }), message('c')])
  })

  test('ignores an id that contains NULL', async () => {
    expect(await collect(parseEventStream<string>(streamOf(['id: a\u0000b\ndata: a\n\n'])))).toStrictEqual([message('a')])
  })

  test('defaults the event name to message and keeps a sent one', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"n":1}\n\nevent: ping\ndata: {"n":2}\n\n'])))

    expect(events).toStrictEqual([message({ n: 1 }), { data: { n: 2 }, event: 'ping' }])
  })

  test('joins data lines when a CRLF falls across two reads', async () => {
    expect(await collect(parseEventStream<string>(streamOf(['data: a\r', '\ndata: b\r\n\r\n'])))).toStrictEqual([message('a\nb')])
  })

  test.each([
    ['a comment-only block', ': heartbeat\n\ndata: a\n\n', [message('a')]],
    ['data:test and data: test', 'data:test\n\ndata: test\n\n', [message('test'), message('test')]],
    ['a bare data field and a two-line empty data', 'data\n\ndata\ndata\n\ndata:', [message(''), message('\n')]],
  ])('follows the specification example with %s', async (_, text, expected) => {
    expect(await collect(parseEventStream<string>(streamOf([text])))).toStrictEqual(expected)
  })

  test('ignores unknown fields and keeps the last retry of a block', async () => {
    const events = await collect(parseEventStream<string>(streamOf(['retry: 1000\nretry: 2000\nunknown: ignored\ndata: ok\n\n'])))

    expect(events).toStrictEqual([message('ok', { retry: 2000 })])
  })

  test('parses JSON data and keeps other data as a string', async () => {
    const events = await collect(parseEventStream(streamOf(['data: {"n":1}\n\n', 'data: hello world\n\n'])))

    expect(events).toStrictEqual([message({ n: 1 }), message('hello world')])
  })

  test('reassembles an event split across chunks and an async iterable of chunks', async () => {
    expect(await collect(parseEventStream(streamOf(['data: {"hal', 'f":true}\n\n'])))).toStrictEqual([message({ half: true })])
    expect(await collect(parseEventStream(asyncIterableOf(['data: {"n":1}\n\n'])))).toStrictEqual([message({ n: 1 })])
  })

  test('accepts a lone CR as a line break and a split CRLF across an empty chunk', async () => {
    expect(await collect(parseEventStream<string>(streamOf(['data: a\rdata: b\r\rdata: c\r\r'])))).toStrictEqual([message('a\nb'), message('c')])
    expect(await collect(parseEventStream<string>(streamOf(['data: a\r', '', '\ndata: b\n\n'])))).toStrictEqual([message('a\nb')])
  })

  test('strips a byte order mark, also when it is split across chunks', async () => {
    const bytes = encoder.encode('\uFEFFdata: a\n\n')
    async function* split() {
      yield bytes.slice(0, 2)
      yield bytes.slice(2)
    }

    expect(await collect(parseEventStream<string>(streamOf(['\uFEFFdata: a\n\n'])))).toStrictEqual([message('a')])
    expect(await collect(parseEventStream<string>(split()))).toStrictEqual([message('a')])
  })

  test('decodes a multi-byte character split across chunks', async () => {
    const bytes = encoder.encode('data: ✓\n\n')
    async function* split() {
      yield bytes.slice(0, 7)
      yield bytes.slice(7)
    }

    expect(await collect(parseEventStream<string>(split()))).toStrictEqual([message('✓')])
  })

  test('ends the stream at the terminator and cancels the reader', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"n":1}\n\ndata: [DONE]\n\ndata: {"n":2}\n\n'))
      },
      cancel,
    })

    expect(await collect(parseEventStream(stream, { terminator: '[DONE]' }))).toStrictEqual([message({ n: 1 })])
    expect(cancel).toHaveBeenCalledOnce()
  })

  test.each([
    ['one unfinished line', 'x'.repeat(1024)],
    ['one unfinished multi-line event', `data: ${'x'.repeat(1024)}\n`],
  ])('cancels the stream when %s outgrows maxEventSize', async (_, chunk) => {
    const bytes = encoder.encode(chunk)
    const cancel = vi.fn()
    const endless = new ReadableStream<Uint8Array>({ pull: (controller) => controller.enqueue(bytes), cancel })

    await expect(collect(parseEventStream(endless, { maxEventSize: 64 * 1024 }))).rejects.toStrictEqual(
      new RangeError('Server-sent event exceeds maxEventSize of 65536 characters'),
    )
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('applies maxEventSize to an event in one chunk and to a comment line', async () => {
    const chunk = `data: ${'x'.repeat(44)}\n\n`
    expect(await collect(parseEventStream<string>(streamOf([chunk]), { maxEventSize: 51 }))).toStrictEqual([message('x'.repeat(44))])
    await expect(collect(parseEventStream(streamOf([chunk]), { maxEventSize: 50 }))).rejects.toThrow(RangeError)
    await expect(collect(parseEventStream(streamOf([`: ${'x'.repeat(30)}`, `${'x'.repeat(30)}\ndata: a\n\n`]), { maxEventSize: 50 }))).rejects.toThrow(
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
    const result = await toEventStream(Promise.resolve({ data: streamOf([`data: ${'x'.repeat(44)}\n\n`]), response }), { maxEventSize: 49 })

    expect(result.response).toBe(response)
    await expect(collect(result.stream)).rejects.toThrow(RangeError)
  })

  test.each([
    ['a missing body', call(undefined)],
    ['a JSON body on a streamed operation', call({ error: 'busy' }, 'application/json')],
    ['a stream that is not an event stream', call(streamOf(['data: a\n\n']), 'text/plain')],
  ])('yields nothing for %s', async (_, first) => {
    expect(await collect((await toEventStream(Promise.resolve(first))).stream)).toStrictEqual([])
  })

  test('yields only the declared events and hands the others to onUnknownEvent', async () => {
    const onUnknownEvent = vi.fn()
    const { stream } = await toEventStream(
      Promise.resolve(call(streamOf(['event: a\ndata: 1\n\nevent: b\ndata: 2\n\ndata: 3\n\n']))),
      { onUnknownEvent },
      { events: ['a'] },
    )

    expect(await collect(stream)).toStrictEqual([{ data: 1, event: 'a' }])
    expect(onUnknownEvent.mock.calls).toStrictEqual([[{ data: 2, event: 'b' }], [message(3)]])
  })

  test('runs transform before the validator and validates data for the data shape', async () => {
    const transform = vi.fn((event: ServerSentEvent) => ({ ...event, data: { n: (event.data as { count: number }).count } }))
    const { stream } = await toEventStream(Promise.resolve(call(streamOf(['id: 9\ndata: {"count":1}\n\n']))), { transform }, { shape: 'data', validator })

    expect(await collect(stream)).toStrictEqual([message({ n: 1, checked: true }, { id: '9' })])
    expect(transform).toHaveBeenCalledOnce()
  })

  test('validates the whole event for the event shape and keeps id and retry', async () => {
    const { stream } = await toEventStream(Promise.resolve(call(streamOf(['event: n\nid: 1\nretry: 5\ndata: 1\n\n']))), {}, { shape: 'event', validator })

    expect(await collect(stream)).toStrictEqual([{ data: 1, event: 'n', id: '1', retry: 5, checked: true }])
  })

  test('a failing validation calls onValidationError and keeps streaming when it is handled', async () => {
    const onValidationError = vi.fn((error: ParseError, context: { value: unknown }) => ({ value: { replaced: context.value } }))
    const first = call(streamOf(['data: {"n":1}\n\ndata: "bad"\n\ndata: {"n":2}\n\n']))
    const { stream } = await toEventStream(Promise.resolve(first), { onValidationError }, { validator })

    expect(await collect(stream)).toStrictEqual([message({ n: 1, checked: true }), message({ replaced: 'bad' }), message({ n: 2, checked: true })])
    expect(onValidationError).toHaveBeenCalledOnce()
    expect(onValidationError.mock.calls[0]![0]).toBeInstanceOf(ParseError)
    expect(onValidationError.mock.calls[0]![1]).toMatchObject({ direction: 'response', source: 'body', value: 'bad' })
  })

  test('a failing validation ends the stream when no handler takes it', async () => {
    const { stream } = await toEventStream(Promise.resolve(call(streamOf(['data: "bad"\n\n']))), { onValidationError: () => undefined }, { validator })

    await expect(collect(stream)).rejects.toBeInstanceOf(ParseError)
  })

  test('validate: false and { response: false } skip the validator', async () => {
    for (const validate of [false, { response: false }] as const) {
      const { stream } = await toEventStream(Promise.resolve(call(streamOf(['data: "bad"\n\n']))), { validate }, { validator })
      expect(await collect(stream)).toStrictEqual([message('bad')])
    }
  })

  describe('reconnect', () => {
    function sender(...calls: Array<EventStreamCall<Response>>): EventStreamSend<Response> & { mock: ReturnType<typeof vi.fn>['mock'] } {
      const queue = [...calls]
      return vi.fn(async () => queue.shift() ?? call(undefined))
    }

    test('resumes a dropped GET stream with Last-Event-ID and the call headers', async () => {
      const send = sender(call(droppedAfter('id: 1\ndata: a\n\n')), call(streamOf(['data: b\n\n'])))
      const result = await toEventStream<ServerSentEvent<string>>(
        send,
        { headers: { Authorization: 'Bearer t' }, reconnect: { initialDelay: 0 } },
        { method: 'GET' },
      )

      expect(await collect(result.stream)).toStrictEqual([message('a', { id: '1' }), message('b', { id: '1' })])
      expect(send.mock.calls).toStrictEqual([[], [{ headers: { Authorization: 'Bearer t', 'Last-Event-ID': '1' } }]])
      expect(result.lastEventId).toBe('1')
    })

    test('omits Last-Event-ID after an empty id', async () => {
      const send = sender(call(droppedAfter('id: 1\ndata: a\n\nid:\ndata: b\n\n')), call(streamOf(['data: c\n\n'])))
      const { stream } = await toEventStream(send, { reconnect: { initialDelay: 0 } }, { method: 'GET' })

      expect(await collect(stream)).toHaveLength(3)
      expect(send.mock.calls[1]).toStrictEqual([{ headers: {} }])
    })

    test('waits the server retry instead of the backoff', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const send = sender(call(droppedAfter('retry: 2\ndata: a\n\n')), call(streamOf(['data: b\n\n'])))
      try {
        await collect((await toEventStream(send, { reconnect: { initialDelay: 1 } }, { method: 'GET' })).stream)
        expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 2)
      } finally {
        setTimeoutSpy.mockRestore()
      }
    })

    test('grows the delay and stops after maxRetries with the last drop', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const send = sender(call(droppedAfter('data: a\n\n')), call(droppedAfter('data: b\n\n')), call(droppedAfter('data: c\n\n')))
      try {
        const { stream } = await toEventStream(send, { reconnect: { initialDelay: 1, growFactor: 2, maxRetries: 2 } }, { method: 'GET' })
        await expect(collect(stream)).rejects.toThrow('connection lost')
        expect(send).toHaveBeenCalledTimes(3)
        expect(setTimeoutSpy.mock.calls.map((args) => args[1])).toStrictEqual([1, 2])
      } finally {
        setTimeoutSpy.mockRestore()
      }
    })

    test('reconnects after a clean close only with onClose', async () => {
      const closed = () => sender(call(streamOf(['data: a\n\n'])), call(streamOf(['data: b\n\n'])), call(undefined))
      const once = closed()
      expect(await collect((await toEventStream(once, { reconnect: { initialDelay: 0 } }, { method: 'GET' })).stream)).toHaveLength(1)
      expect(once).toHaveBeenCalledTimes(1)

      const again = closed()
      expect(await collect((await toEventStream(again, { reconnect: { initialDelay: 0, onClose: true } }, { method: 'GET' })).stream)).toHaveLength(2)
      expect(again).toHaveBeenCalledTimes(3)
    })

    test('stops on abort, on a non-stream response and when the consumer breaks', async () => {
      const controller = new AbortController()
      const aborted = sender(call(droppedAfter('data: a\n\n')))
      const { stream } = await toEventStream(aborted, { signal: controller.signal, reconnect: { initialDelay: 1000 } }, { method: 'GET' })
      setTimeout(() => controller.abort(), 5)
      expect(await collect(stream)).toStrictEqual([message('a')])
      expect(aborted).toHaveBeenCalledTimes(1)

      const json = sender(call(droppedAfter('data: a\n\n')), call({ error: true }, 'application/json'))
      expect(await collect((await toEventStream(json, { reconnect: { initialDelay: 0 } }, { method: 'GET' })).stream)).toStrictEqual([message('a')])

      const broken = sender(call(droppedAfter('data: a\n\ndata: b\n\n')), call(streamOf(['data: c\n\n'])))
      const { stream: breaking } = await toEventStream(broken, { reconnect: { initialDelay: 0 } }, { method: 'GET' })
      for await (const event of breaking) if (event.data === 'a') break
      expect(broken).toHaveBeenCalledTimes(1)
    })

    test('requires resume for a method other than GET and sends what it returns', async () => {
      await expect(toEventStream(sender(), { reconnect: {} }, { method: 'POST' })).rejects.toThrow(TypeError)

      const send = sender(call(droppedAfter('id: 3\ndata: a\n\n')), call(streamOf(['data: b\n\n'])))
      const resume = vi.fn((lastEventId: string) => ({ method: 'GET' as const, headers: { 'X-Resume': lastEventId } }))
      await collect((await toEventStream(send, { reconnect: { initialDelay: 0, resume } }, { method: 'POST' })).stream)

      expect(resume).toHaveBeenCalledWith('3')
      expect(send.mock.calls[1]).toStrictEqual([{ method: 'GET', headers: { 'Last-Event-ID': '3', 'X-Resume': '3' } }])
    })

    test('never reconnects a plain promise', async () => {
      const { stream } = await toEventStream(Promise.resolve(call(droppedAfter('data: a\n\n'))), { reconnect: { initialDelay: 0 } })

      await expect(collect(stream)).rejects.toThrow('connection lost')
    })
  })
})
