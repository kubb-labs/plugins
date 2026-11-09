import type { DataShape, NativeRequest, NativeResponse, Options, RequestResult, SuccessOf } from './client.ts'
import { isValidationEnabled, runValidator, type StandardSchemaValidator, type ValidateOption, type ValidationErrorHandler } from './standardSchema.ts'

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

/** Per-call options of a streamed operation, passed next to its request params. */
export type EventStreamOptions = {
  /**
   * The largest number of characters, line breaks included, one event may hold before the blank line that ends it, or one
   * line of JSON Lines may hold.
   * A larger event throws a `RangeError` and cancels the stream. Set `Infinity` to turn the limit off.
   * @default 16777216
   */
  maxEventSize?: number
  /**
   * Ends the stream when an event's raw `data`, or a JSON Lines line, equals this value, such as `[DONE]`.
   */
  terminator?: string
  /**
   * Maps each Server-Sent Event before validation. JSON Lines items are not passed through it.
   */
  transform?: (event: ServerSentEvent) => ServerSentEvent
}

/** The options of a streamed operation: the call's `Options` with the per-call stream options, as `Options` is for a regular call. */
export type StreamOptions<TData extends DataShape, ThrowOnError extends boolean = true> = Options<TData, ThrowOnError> & EventStreamOptions

/**
 * The validation settings a call or its client may set.
 */
type ValidationSettings = { validate?: ValidateOption; onValidationError?: ValidationErrorHandler }

/**
 * What the client resolves a streamed call to: the body as a stream or a decoded value, its content type, and the native response.
 */
export type EventStreamCall<TResponse> = { data: unknown; error?: unknown; status?: number; contentType?: string; request?: NativeRequest; response: TResponse }

/**
 * Parsed events with the fields a `RequestResult` carries. `TEvent` is the event type, such as `ServerSentEvent<Pet>`
 * or `TypedEvent<ChatEvent>`. Iterating the result reads `stream`.
 */
export type EventStreamResult<TEvent = ServerSentEvent, TResponse = NativeResponse> = AsyncIterable<TEvent> & {
  stream: AsyncGenerator<TEvent>
  /** The same events as `stream` on a 2xx response, so `.unwrap()` and `returnType: 'data'` return them. */
  data: AsyncGenerator<TEvent> | undefined
  status: number | undefined
  /** The error body of a failed call with `throwOnError: false`, whose `stream` then yields nothing. */
  error: unknown
  contentType: string | undefined
  request: NativeRequest | undefined
  response: TResponse
  /**
   * The last event ID the server sent, to resume from with a `Last-Event-ID` header on a new call. Empty until the server sends `id`.
   */
  readonly lastEventId: string
}

type StreamParts<TEvent> = AsyncIterable<TEvent> & { stream: AsyncGenerator<TEvent>; readonly lastEventId: string }

type WithEvents<TResult, TEvent> = TResult extends { error: undefined } ? Omit<TResult, 'data'> & { data: AsyncGenerator<TEvent> } : TResult

/**
 * A stream call's result, as `RequestResult` is a regular call's: `status` narrows `error`, and the events are its
 * `data`. Branching on `ThrowOnError` lets a generated call cast to it.
 */
export type StreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = ThrowOnError extends true
  ? WithEvents<RequestResult<TResponses, true>, TEvent> & StreamParts<TEvent>
  : WithEvents<RequestResult<TResponses, false>, TEvent> & StreamParts<TEvent>

/**
 * What a stream operation returns with `returnType: 'data'`, as `UnwrappedResult` is for a regular call.
 */
export type UnwrappedStreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = ThrowOnError extends true
  ? AsyncGenerator<TEvent>
  : StreamResult<TResponses, false, TEvent>

/** The last event ID, shared with the result so it can be read after the loop. */
type Cursor = { lastEventId: string }

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

/**
 * Decodes a byte stream and splits it on CRLF, CR, or LF, a CRLF split across chunks included. Yields each chunk's finished
 * lines and the unfinished `rest`, which the next chunk continues.
 */
async function* readLines(stream: EventStreamInput): AsyncGenerator<{ lines: Array<string>; rest: string }> {
  const decoder = new TextDecoder()
  let rest = ''
  let endsWithCR = false
  for await (const chunk of readBytes(stream)) {
    const decoded = decoder.decode(chunk, { stream: true })
    if (!decoded) continue
    // A CRLF split across chunks already ended its line on the `\r`.
    const text: string = endsWithCR && decoded.startsWith('\n') ? decoded.slice(1) : decoded
    endsWithCR = text.endsWith('\r')

    const lines = text.split(/\r\n|\r|\n/)
    lines[0] = rest + lines[0]
    rest = lines.pop() ?? ''
    yield { lines, rest }
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
 * all digits, and an unfinished event at the end is dropped. `data` is parsed as JSON when it is valid and kept as text
 * otherwise. Consume with `for await`, and break the loop to cancel the stream.
 */
type EventStreamInput = ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>

export async function* parseEventStream<TData = unknown>(
  input: EventStreamInput | (Pick<EventStreamOptions, 'maxEventSize' | 'terminator'> & { stream: EventStreamInput; cursor?: Cursor }),
): AsyncGenerator<ServerSentEvent<TData>> {
  // The stream alone is the form earlier releases took.
  const { stream, maxEventSize = 16 * 1024 * 1024, terminator, cursor = { lastEventId: '' } } = isStreamBody(input) ? { stream: input } : input
  const tooLarge = `Server-sent event exceeds maxEventSize of ${maxEventSize} characters`
  let type = ''
  let data: Array<string> = []
  let retry: number | undefined
  let size = 0
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
        if (/^\d+$/.test(value)) retry = Number(value)
    }
  }

  for await (const { lines, rest: line } of readLines(stream)) {
    for (const part of lines) {
      if (!part) {
        // The ID is committed at the blank line, so a drop inside an event does not report an ID past the last full event.
        cursor.lastEventId = pendingId
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

/**
 * Parses a JSON Lines body, such as `application/jsonl` or `application/x-ndjson`, into one value per line. Lines end on
 * CRLF, CR, or LF, a blank line is skipped, and a last line without a line break still counts. The record separator that
 * starts each `application/json-seq` record is dropped. A line that is not valid JSON throws a `SyntaxError`. Consume
 * with `for await`, and break the loop to cancel the stream.
 */
export async function* parseJsonLines<TData = unknown>({
  stream,
  maxEventSize = 16 * 1024 * 1024,
  terminator,
}: Pick<EventStreamOptions, 'maxEventSize' | 'terminator'> & { stream: EventStreamInput }): AsyncGenerator<TData> {
  const tooLarge = `JSON line exceeds maxEventSize of ${maxEventSize} characters`
  async function* lines(): AsyncGenerator<string> {
    let last = ''
    for await (const chunk of readLines(stream)) {
      yield* chunk.lines
      last = chunk.rest
      if (last.length > maxEventSize) throw new RangeError(tooLarge)
    }
    yield last
  }

  for await (const raw of lines()) {
    if (raw.length + 1 > maxEventSize) throw new RangeError(tooLarge)
    // shortcut: a json-seq record must fit on one line, so a pretty-printed record fails to parse; split on the separator to read one.
    const line = raw.split('\u001e').join('').trim()
    if (!line) continue
    if (line === terminator) return
    yield JSON.parse(line) as TData
  }
}

function isStreamBody(data: unknown): data is ReadableStream<Uint8Array> | AsyncIterable<Uint8Array> {
  return !!data && typeof data === 'object' && (Symbol.asyncIterator in data || 'getReader' in data)
}

/**
 * Reads a call as typed Server-Sent Events, or as JSON Lines with `shape: 'line'`, transformed and validated one by one,
 * until the terminator or the end of the stream. A successful call whose body is not a stream, such as a decoded JSON
 * answer, throws a `TypeError` with the body as its `cause`. A dropped connection ends the loop with the transport's
 * error, and `lastEventId` on the result is the ID to resume from. An aborted `config.signal` ends the loop with its
 * `reason` right after the event the consumer saw, so `lastEventId` stays at that event.
 */
export async function toEventStream<TEvent = ServerSentEvent, TResponse = NativeResponse>(
  call: Promise<EventStreamCall<TResponse>>,
  {
    client,
    config: options = {},
    ...meta
  }: {
    /**
     * The client the call went through, for the validation settings a call does not set itself.
     */
    client?: { getConfig: () => ValidationSettings }
    config?: EventStreamOptions & ValidationSettings & { signal?: AbortSignal }
    /**
     * `event` when the document types each event with its own `event` and `data`, `data` when it types only the payload, or
     * `line` when the body is JSON Lines and each line is one item.
     * @default 'data'
     */
    shape?: 'event' | 'data' | 'line'
    /**
     * Validates each event (`shape: 'event'`), its `data` (`shape: 'data'`), or each line (`shape: 'line'`), after `transform`.
     */
    validator?: StandardSchemaValidator
  } = {},
): Promise<EventStreamResult<TEvent, TResponse>> {
  const defaults = client?.getConfig() ?? {}
  const onValidationError = options.onValidationError ?? defaults.onValidationError
  const validator = isValidationEnabled(options.validate ?? defaults.validate, 'response') ? meta.validator : undefined
  const cursor: Cursor = { lastEventId: '' }
  const { data: body, error, status, contentType, request, response } = await call
  const ok = status === undefined || (status >= 200 && status < 300)
  // A transport decodes a JSON answer, so a success that is not a stream would otherwise end as an empty stream.
  // A 204 or empty answer has no body, `undefined` or `null`, and still ends as an empty stream.
  if (ok && body != null && !isStreamBody(body)) {
    // `cause` is assigned, since the constructor option needs the ES2022 library a generated client cannot assume.
    const expected = meta.shape === 'line' ? 'a JSON Lines' : 'a text/event-stream'
    throw Object.assign(new TypeError(`Expected ${expected} body, got ${contentType ?? 'a body without a content type'}`), { cause: body })
  }

  const validate = (value: unknown) =>
    validator ? runValidator({ validator, value, context: { direction: 'response', source: 'body' }, onValidationError }) : value
  const validateEvent = async (event: ServerSentEvent): Promise<ServerSentEvent> => {
    if (!validator) return event
    const validated = await validate(meta.shape === 'event' ? event : event.data)
    // The schema may not declare `id` and `retry`, so the parsed value is merged over the event instead of replacing it.
    return meta.shape === 'event' ? { ...event, ...(validated as object) } : { ...event, data: validated }
  }

  async function* items(stream: EventStreamInput): AsyncGenerator<unknown> {
    const { maxEventSize, terminator, transform } = options
    if (meta.shape !== 'line') {
      for await (const event of parseEventStream({ stream, maxEventSize, terminator, cursor })) yield validateEvent(transform ? transform(event) : event)
      return
    }
    // A JSON Lines item is not an event, so it skips `transform` and is validated as a whole.
    for await (const item of parseJsonLines({ stream, maxEventSize, terminator })) yield validate(item)
  }

  async function* events(): AsyncGenerator<TEvent> {
    if (!isStreamBody(body)) return
    // A consumer `break` or a failed event closes this loop, which cancels the reader.
    try {
      for await (const item of items(body)) {
        yield item as TEvent
        // A chunk may hold more events, so stop before the parser reads on.
        if (options.signal?.aborted) throw options.signal.reason
      }
    } catch (error) {
      // A transport reports an abort in its own error type, such as axios's `CanceledError`, so rethrow the signal's reason instead.
      throw options.signal?.aborted ? options.signal.reason : error
    }
  }

  const stream = events()
  return {
    stream,
    data: ok ? stream : undefined,
    status,
    error,
    contentType,
    request,
    response,
    get lastEventId() {
      return cursor.lastEventId
    },
    [Symbol.asyncIterator]: () => stream,
  }
}
