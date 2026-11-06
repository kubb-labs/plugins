import type { AxiosResponse } from 'axios'
import type { HttpMethod } from './serializers.ts'
import { ParseError, type StandardSchemaValidator, validateStandardSchema } from './standardSchema.ts'

type NativeResponse = AxiosResponse

/**
 * One decoded Server-Sent Event. `data` is parsed as JSON when valid and kept as the raw string otherwise,
 * `event` is `message` when the server sent no `event` field, and `id` is the last event ID the stream has set.
 */
export type ServerSentEvent<TData = unknown> = {
  data: TData
  event: string
  id?: string
  retry?: number
}

/** An event the document types by name: the member's own `event` and `data`, plus the `id` and `retry` any event may carry. */
export type EventOf<T> = T & Pick<ServerSentEvent, 'id' | 'retry'>

/** Reconnects with `Last-Event-ID` after the stream drops, as `EventSource` does: 2 retries, from 1000 ms growing by 1.5 up to 30000 ms. */
export type Reconnect = {
  /** Most reconnects attempted after the first connection. */
  maxRetries?: number
  /** Delay before the first reconnect in milliseconds, unless the server sent `retry`. */
  initialDelay?: number
  /** Longest delay between reconnects in milliseconds. */
  maxDelay?: number
  /** Factor the delay grows by after each reconnect. */
  growFactor?: number
  /** Also reconnect after a clean close, as `EventSource` does. Off, a clean close ends the stream. */
  onClose?: boolean
  /** Builds the resume request from the last event ID. Required for any method but GET, which would repeat the operation. */
  resume?: (lastEventId: string) => ResumeInit
}

/** The part of a request a reconnect may change. */
export type ResumeInit = { method?: HttpMethod; headers?: unknown; body?: unknown }

/** Per-call options of a streamed operation, passed next to its request params. */
export type EventStreamOptions = {
  /**
   * The largest number of characters, line breaks included, one event may hold before the blank line that ends it.
   * A larger event throws a `RangeError` and cancels the stream. Set `Infinity` to turn the limit off.
   * @default 16777216
   */
  maxEventSize?: number
  /**
   * Ends the stream when an event's raw `data` equals this value, such as `[DONE]`.
   */
  terminator?: string
  /**
   * Maps each event before validation.
   */
  transform?: (event: ServerSentEvent) => ServerSentEvent
  /**
   * Receives each event whose name the document does not declare. Such events are not yielded.
   */
  onUnknownEvent?: (event: ServerSentEvent) => void
  reconnect?: Reconnect
}

/** What the generated function knows about the stream from the document. */
export type EventStreamMeta = {
  /**
   * Method of the call. A reconnect repeats the call only for GET unless `reconnect.resume` is set.
   */
  method?: string
  /**
   * `event` when the document types each event with its own `event` and `data`, `data` when it types only the payload.
   * @default 'data'
   */
  shape?: 'event' | 'data'
  /**
   * Event names the document declares. Any other event goes to `onUnknownEvent` instead of the stream.
   */
  events?: ReadonlyArray<string>
  /**
   * Validates each event (`shape: 'event'`) or its `data` (`shape: 'data'`), after `transform`.
   */
  validator?: StandardSchemaValidator
}

/** The fields of the call's config the stream reads: its headers for a resume, its signal, and how validation errors are handled. */
export type EventStreamCallOptions = {
  headers?: unknown
  signal?: AbortSignal
  validate?: boolean | { response?: boolean }
  onValidationError?: (
    error: ParseError,
    context: { value: unknown; direction: 'response'; source: 'body'; method?: string },
  ) => { value: unknown } | void | Promise<{ value: unknown } | void>
}

/**
 * The answer to one send: the body as a stream or a decoded value, its content type, and the native response.
 */
export type EventStreamCall<TResponse> = { data: unknown; contentType?: string; response: TResponse }

/** Sends the call, or the resume request after a drop. */
export type EventStreamSend<TResponse> = (init?: ResumeInit) => Promise<EventStreamCall<TResponse>>

/** Parsed events alongside the native response of the first connection. */
export type EventStreamResult<TEvent = ServerSentEvent, TResponse = NativeResponse> = {
  stream: AsyncGenerator<TEvent>
  response: TResponse
  /**
   * The last event ID the stream has set, to resume from later. Empty until the server sends `id`.
   */
  readonly lastEventId: string
}

/** The fields that carry across events: the last event ID and the latest `retry`. */
type Cursor = { lastEventId: string; retry?: number }

async function* readBytes(stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): AsyncGenerator<Uint8Array> {
  if (!('getReader' in stream)) {
    yield* stream
    return
  }

  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      yield value
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
}

function parseData<TData>(raw: string): TData {
  try {
    return JSON.parse(raw) as TData
  } catch {
    return raw as TData
  }
}

/**
 * Parses a `text/event-stream` body as the WHATWG event stream interpretation does: an event is dispatched at its blank line
 * when it holds `data`, `event` defaults to `message`, `id` carries across events until an empty `id` resets it, `retry` needs
 * all digits, and an unfinished event at the end is dropped. Consume with `for await`; break the loop to cancel the stream.
 */
export async function* parseEventStream<TData = unknown>({
  stream,
  maxEventSize = 16 * 1024 * 1024,
  terminator,
  cursor = { lastEventId: '' },
}: Pick<EventStreamOptions, 'maxEventSize' | 'terminator'> & {
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>
  cursor?: Cursor
}): AsyncGenerator<ServerSentEvent<TData>> {
  const decoder = new TextDecoder()
  const tooLarge = `Server-sent event exceeds maxEventSize of ${maxEventSize} characters`
  let type = ''
  let data: Array<string> = []
  let retry: number | undefined
  let size = 0
  let line = ''
  let endsWithCR = false

  const readField = (part: string) => {
    const index = part.indexOf(':')
    const name = index === -1 ? part : part.slice(0, index)
    const value = index === -1 ? '' : part.slice(index + 1).replace(/^ /, '')
    switch (name) {
      case 'data':
        data.push(value)
        break
      case 'event':
        type = value
        break
      case 'id':
        if (!value.includes('\u0000')) cursor.lastEventId = value
        break
      case 'retry':
        if (!/^\d+$/.test(value)) break
        retry = Number(value)
        cursor.retry = retry
    }
  }

  for await (const chunk of readBytes(stream)) {
    const decoded = decoder.decode(chunk, { stream: true })
    if (!decoded) continue
    // A CRLF split across chunks already ended its line on the `\r`.
    const text: string = endsWithCR && decoded.startsWith('\n') ? decoded.slice(1) : decoded
    endsWithCR = text.endsWith('\r')

    const parts = text.split(/\r\n|\r|\n/)
    parts[0] = line + parts[0]
    line = parts.pop() ?? ''
    for (const part of parts) {
      if (!part) {
        if (data.length) {
          const raw = data.join('\n')
          if (raw === terminator) return
          yield {
            data: parseData<TData>(raw),
            event: type || 'message',
            ...(cursor.lastEventId ? { id: cursor.lastEventId } : {}),
            ...(retry !== undefined ? { retry } : {}),
          }
        }
        type = ''
        data = []
        retry = undefined
        size = 0
        continue
      }
      // A finished line counts one more character for its line break.
      if (size + part.length + 1 > maxEventSize) throw new RangeError(tooLarge)
      size += part.length + 1
      if (!part.startsWith(':')) readField(part)
    }
    if (size + line.length > maxEventSize) throw new RangeError(tooLarge)
  }
}

function isStreamBody(data: unknown): data is ReadableStream<Uint8Array> | AsyncIterable<Uint8Array> {
  return !!data && typeof data === 'object' && (Symbol.asyncIterator in data || 'getReader' in data)
}

function headerRecord(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') return {}
  return Symbol.iterator in headers ? Object.fromEntries(headers as Iterable<[string, string]>) : { ...(headers as Record<string, string>) }
}

function sleep({ ms, signal }: { ms: number; signal?: AbortSignal }): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    signal?.addEventListener('abort', done)
  })
}

/**
 * Reads a call as typed Server-Sent Events: only the declared events, transformed and validated one by one, until the
 * terminator, a body that is not an event stream, or the server closes it. With `reconnect`, a dropped stream resumes with
 * `Last-Event-ID` after the server's `retry` or a growing delay, until `maxRetries`, an abort, or a non-stream response.
 */
export async function toEventStream<TEvent = ServerSentEvent, TResponse = NativeResponse>({
  send,
  config: options = {},
  ...meta
}: { send: EventStreamSend<TResponse> | Promise<EventStreamCall<TResponse>>; config?: EventStreamOptions & EventStreamCallOptions } & EventStreamMeta): Promise<
  EventStreamResult<TEvent, TResponse>
> {
  // A plain promise cannot be sent again, so it never reconnects.
  const reconnect = typeof send === 'function' ? options.reconnect : undefined
  const { maxRetries = 2, initialDelay = 1000, maxDelay = 30_000, growFactor = 1.5, onClose = false, resume } = reconnect ?? {}
  if (reconnect && !resume && meta.method && meta.method !== 'GET') {
    throw new TypeError(`reconnect.resume is required to resume a ${meta.method} stream without repeating the operation`)
  }
  const validate = typeof options.validate === 'object' ? options.validate.response !== false : options.validate !== false
  const validator = validate ? meta.validator : undefined
  const cursor: Cursor = { lastEventId: '' }
  const first = await (typeof send === 'function' ? send() : send)

  const validateEvent = async (event: ServerSentEvent): Promise<ServerSentEvent> => {
    if (!validator) return event
    const value = meta.shape === 'event' ? event : event.data
    const context = { direction: 'response', source: 'body', method: meta.method, value } as const
    const validated = await validateStandardSchema(validator, value).catch(async (error: unknown) => {
      if (!options.onValidationError || !(error instanceof ParseError)) throw error
      const handled = await options.onValidationError(error, context)
      if (!handled) throw error
      return handled.value
    })
    // The schema may not declare `id` and `retry`, so the parsed value is merged over the event instead of replacing it.
    return meta.shape === 'event' ? { ...event, ...(validated as object) } : { ...event, data: validated }
  }

  async function* events(): AsyncGenerator<TEvent> {
    let call: EventStreamCall<TResponse> | undefined = first
    let delay = initialDelay
    for (let attempt = 0; ; attempt++) {
      // A reconnect that could not connect left no call, which counts as a drop.
      let dropped = !call
      if (call) {
        const body = call.data
        if (!isStreamBody(body)) return
        if (call.contentType && !call.contentType.includes('text/event-stream')) {
          if ('cancel' in body) await body.cancel().catch(() => {})
          return
        }
        const parsed = parseEventStream({ stream: body, maxEventSize: options.maxEventSize, terminator: options.terminator, cursor })
        // Only a failed read is a drop worth a reconnect; a too-large event, a failed transform or validation, and a consumer error end the stream.
        const read = async () => {
          try {
            return await parsed.next()
          } catch (error) {
            if (!reconnect || error instanceof RangeError || options.signal?.aborted || attempt >= maxRetries) throw error
            dropped = true
            return { done: true as const, value: undefined }
          }
        }
        try {
          for (let next = await read(); !next.done; next = await read()) {
            const event = next.value
            if (meta.events && !meta.events.includes(event.event)) {
              options.onUnknownEvent?.(event)
              continue
            }
            yield (await validateEvent(options.transform ? options.transform(event) : event)) as TEvent
          }
        } finally {
          // A consumer `break` or a failed event leaves the parser suspended; closing it cancels the reader.
          await parsed.return(undefined).catch(() => {})
        }
      }
      if (!reconnect || (!dropped && !onClose) || attempt >= maxRetries || options.signal?.aborted) return

      await sleep({ ms: cursor.retry ?? delay, signal: options.signal })
      if (options.signal?.aborted) return
      delay = Math.min(delay * growFactor, maxDelay)
      const init: ResumeInit = resume?.(cursor.lastEventId) ?? {}
      const method = init.method ?? meta.method
      const headers = {
        ...headerRecord(options.headers),
        ...(cursor.lastEventId ? { 'Last-Event-ID': cursor.lastEventId } : {}),
        ...headerRecord(init.headers),
      }
      // A GET or HEAD resume carries no body. A connection that fails is retried like a drop; a refused one (`ResponseError`) ends the stream.
      call = await (send as EventStreamSend<TResponse>)({ ...(method === 'GET' || method === 'HEAD' ? { body: undefined } : {}), ...init, headers }).catch(
        (error: unknown) => {
          if ((error instanceof Error && error.name === 'ResponseError') || options.signal?.aborted || attempt + 1 >= maxRetries) throw error
          return undefined
        },
      )
    }
  }

  return {
    stream: events(),
    response: first.response,
    get lastEventId() {
      return cursor.lastEventId
    },
  }
}
