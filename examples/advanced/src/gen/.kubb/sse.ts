import type { HttpMethod } from './serializers'
import type { StandardSchemaValidator } from './standardSchema'
import type { AxiosResponse } from 'axios'
import { ParseError, validateStandardSchema } from './standardSchema'

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
export type TypedEvent<TEvent> = TEvent & Pick<ServerSentEvent, 'id' | 'retry'>

/** Reconnects with `Last-Event-ID` after the stream drops, as `EventSource` does: 2 retries, from 1000 ms growing by 1.5 up to 30000 ms. */
export type ReconnectOptions = {
  /** The largest number of reconnects after the first connection. */
  maxRetries?: number
  /** Delay before the first reconnect in milliseconds, unless the server sent `retry`. */
  delay?: number
  /** Longest delay the backoff grows to in milliseconds. The server's `retry` replaces the backoff and is not capped. */
  maxDelay?: number
  /** Factor the delay grows by after each reconnect. */
  growFactor?: number
  /** Also reconnect after a clean close, as `EventSource` does. When off, a clean close ends the stream. */
  onClose?: boolean
  /** Builds the resume request from the last event ID. Required for any method but GET, which would repeat the operation. */
  resume?: (lastEventId: string) => ResumeRequest
}

/** The part of a request a reconnect may change. */
export type ResumeRequest = { method?: HttpMethod; headers?: unknown; body?: unknown }

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
  reconnect?: ReconnectOptions
}

/** What the generated function knows about the stream from the document. */
export type EventStreamSchema = {
  /**
   * Method of the call. A reconnect repeats the call only for GET unless `reconnect.resume` is set.
   */
  method?: string
  /**
   * `event` when the document types each event with its own `event` and `data`, or `data` when it types only the payload.
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
  /**
   * Keeps `data` as text instead of parsing JSON: `true` for every event, or the names of the events whose `data` the
   * document types as a string.
   */
  text?: boolean | ReadonlyArray<string>
}

/**
 * The validation settings a call or its client may set.
 */
type ValidationSettings = {
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
export type EventStreamSend<TResponse> = (init?: ResumeRequest) => Promise<EventStreamCall<TResponse>>

/** The payload wrapped in `ServerSentEvent`, or the item itself when the document types it as a whole event. */
type StreamEvent<TData> = TData extends { event: string } ? TData : ServerSentEvent<TData>

/** Parsed events alongside the native response of the first connection. `TData` is the payload, or the typed event. */
export type EventStreamResult<TData = unknown, TResponse = NativeResponse> = {
  stream: AsyncGenerator<StreamEvent<TData>>
  response: TResponse
  /**
   * The last event ID to resume from later: the call's `Last-Event-ID` header until the server sends `id`, then the server's.
   */
  readonly lastEventId: string
}

/** What carries across events and connections: the last event ID, the latest `retry`, and whether the terminator ended the stream. */
type Cursor = { lastEventId: string; retry?: number; done?: boolean }

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
 * Parses a `text/event-stream` body as the WHATWG event stream specification does: an event is dispatched at its blank line
 * when it holds `data`, `event` defaults to `message`, `id` carries across events until an empty `id` resets it, `retry` needs
 * all digits, and an unfinished event at the end is dropped. `data` is parsed as JSON when it is valid, except for the events
 * in `text`. Consume with `for await`, and break the loop to cancel the stream.
 */
export async function* parseEventStream<TData = unknown>({
  stream,
  maxEventSize = 16 * 1024 * 1024,
  terminator,
  text = false,
  cursor = { lastEventId: '' },
}: Pick<EventStreamOptions, 'maxEventSize' | 'terminator'> & {
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>
  text?: boolean | ReadonlyArray<string>
  cursor?: Cursor
}): AsyncGenerator<ServerSentEvent<TData>> {
  const decoder = new TextDecoder()
  const tooLarge = `Server-sent event exceeds maxEventSize of ${maxEventSize} characters`
  const isText = (name: string) => text === true || (Array.isArray(text) && text.includes(name))
  let type = ''
  let data: Array<string> = []
  let retry: number | undefined
  let size = 0
  let line = ''
  let endsWithCR = false
  let pendingId = cursor.lastEventId

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
        if (!value.includes('\u0000')) pendingId = value
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
        // The ID is committed at the blank line, so a drop inside an event does not resume past it.
        cursor.lastEventId = pendingId
        if (data.length) {
          const raw = data.join('\n')
          const name = type || 'message'
          if (raw === terminator) {
            cursor.done = true
            return
          }
          yield {
            data: isText(name) ? (raw as TData) : parseData<TData>(raw),
            event: name,
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
      // A comment line is dropped and does not count toward the event, but must fit the limit on its own.
      if (part.startsWith(':')) {
        if (part.length + 1 > maxEventSize) throw new RangeError(tooLarge)
        continue
      }
      // A finished line counts one more character for its line break.
      if (size + part.length + 1 > maxEventSize) throw new RangeError(tooLarge)
      size += part.length + 1
      readField(part)
    }
    if ((line.startsWith(':') ? line.length : size + line.length) > maxEventSize) throw new RangeError(tooLarge)
  }
}

function isStreamBody(data: unknown): data is ReadableStream<Uint8Array> | AsyncIterable<Uint8Array> {
  return !!data && typeof data === 'object' && (Symbol.asyncIterator in data || 'getReader' in data)
}

function headerEntries(headers: unknown): Array<[string, string]> {
  if (!headers || typeof headers !== 'object') return []
  return Symbol.iterator in headers ? [...(headers as Iterable<[string, string]>)] : Object.entries(headers as Record<string, string>)
}

const isLastEventId = ([name]: [string, string]) => name.toLowerCase() === 'last-event-id'

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
 * terminator, a body that is not an event stream, or a clean close. With `reconnect`, a dropped stream resumes with
 * `Last-Event-ID` after the server's `retry` or a growing delay, until `maxRetries`, an abort, or a non-stream response.
 */
export async function toEventStream<TData = unknown, TResponse = NativeResponse>({
  send,
  client,
  config: options = {},
  ...meta
}: {
  send: EventStreamSend<TResponse> | Promise<EventStreamCall<TResponse>>
  /**
   * The client the call went through, for the validation settings a call does not set itself.
   */
  client?: { getConfig: () => ValidationSettings }
  config?: EventStreamOptions & ValidationSettings & { headers?: unknown; signal?: AbortSignal }
} & EventStreamSchema): Promise<EventStreamResult<TData, TResponse>> {
  // A plain promise cannot be sent again, so it never reconnects.
  const reconnect = typeof send === 'function' ? options.reconnect : undefined
  const { maxRetries = 2, delay = 1000, maxDelay = 30_000, growFactor = 1.5, onClose = false, resume } = reconnect ?? {}
  if (reconnect && !resume && meta.method && meta.method.toUpperCase() !== 'GET') {
    throw new TypeError(`reconnect.resume is required to resume a ${meta.method} stream without repeating the operation`)
  }
  const defaults = client?.getConfig() ?? {}
  const validateSetting = options.validate ?? defaults.validate
  const onValidationError = options.onValidationError ?? defaults.onValidationError
  const validate = typeof validateSetting === 'object' ? validateSetting.response !== false : validateSetting !== false
  const validator = validate ? meta.validator : undefined
  const callHeaders = headerEntries(options.headers)
  // The runtime owns `Last-Event-ID`: a header on the call seeds the cursor and is not repeated once the server clears the ID.
  const cursor: Cursor = { lastEventId: callHeaders.find(isLastEventId)?.[1] ?? '' }
  const first = await (typeof send === 'function' ? send() : send)

  const validateEvent = async (event: ServerSentEvent): Promise<ServerSentEvent> => {
    if (!validator) return event
    const value = meta.shape === 'event' ? event : event.data
    const context = { direction: 'response', source: 'body', method: meta.method, value } as const
    const validated = await validateStandardSchema(validator, value).catch(async (error: unknown) => {
      if (!onValidationError || !(error instanceof ParseError)) throw error
      const handled = await onValidationError(error, context)
      if (!handled) throw error
      return handled.value
    })
    // The schema may not declare `id` and `retry`, so the parsed value is merged over the event instead of replacing it.
    return meta.shape === 'event' ? { ...event, ...(validated as object) } : { ...event, data: validated }
  }

  async function* events(): AsyncGenerator<StreamEvent<TData>> {
    let call: EventStreamCall<TResponse> | undefined = first
    let wait = delay
    for (let attempt = 0; ; attempt++) {
      // A reconnect that could not connect left no call, which counts as a drop.
      let dropped = !call
      if (call) {
        const body = call.data
        if (!isStreamBody(body)) return
        // A custom transport may pass the raw header, with a charset parameter.
        if (call.contentType?.split(';')[0]?.trim().toLowerCase() !== 'text/event-stream') {
          if ('cancel' in body) await body.cancel().catch(() => {})
          return
        }
        const parsed = parseEventStream({ stream: body, maxEventSize: options.maxEventSize, terminator: options.terminator, text: meta.text, cursor })
        // Only a failed read is a drop worth a reconnect. A too-large event, a failed transform or validation, and a consumer error end the stream.
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
            yield (await validateEvent(options.transform ? options.transform(event) : event)) as StreamEvent<TData>
          }
        } finally {
          // A consumer `break` or a failed event leaves the parser suspended, so closing it cancels the reader.
          await parsed.return(undefined).catch(() => {})
        }
      }
      if (cursor.done || !reconnect || (!dropped && !onClose) || attempt >= maxRetries || options.signal?.aborted) return

      await sleep({ ms: cursor.retry ?? wait, signal: options.signal })
      if (options.signal?.aborted) return
      wait = Math.min(wait * growFactor, maxDelay)
      const init: ResumeRequest = resume?.(cursor.lastEventId) ?? {}
      const method = (init.method ?? meta.method)?.toUpperCase()
      const headers: Record<string, string> = Object.fromEntries([...callHeaders, ...headerEntries(init.headers)].filter((entry) => !isLastEventId(entry)))
      if (cursor.lastEventId) headers['Last-Event-ID'] = cursor.lastEventId
      // A GET or HEAD resume carries no body. A connection that fails is retried like a drop, and a refused one (`ResponseError`) ends the stream.
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
