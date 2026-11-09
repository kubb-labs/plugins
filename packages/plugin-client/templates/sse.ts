import type { EventStreamOptions, MediaType, MediaTypes, ServerSentEvent } from './client.ts'

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

async function* mapEvents(events: AsyncIterable<ServerSentEvent>, transform: (event: ServerSentEvent) => ServerSentEvent): AsyncGenerator<ServerSentEvent> {
  for await (const event of events) yield transform(event)
}

/**
 * `text/event-stream`: a stream call reads it event by event with `parseEventStream`, honoring `maxEventSize`,
 * `terminator`, and `transform`, and records the last event ID. A whole body, such as an error, is read as text.
 */
export const eventStream: MediaType = {
  decode: (response) => response.text(),
  stream: (body, { config, cursor }) => {
    const events = parseEventStream({ stream: body, maxEventSize: config.maxEventSize, terminator: config.terminator, cursor })
    return config.transform ? mapEvents(events, config.transform) : events
  },
}

/**
 * JSON Lines: a stream call reads one JSON value per line with `parseJsonLines`, honoring `maxEventSize` and
 * `terminator`. A whole body, such as an error, is read as text.
 */
export const jsonLines: MediaType = {
  decode: (response) => response.text(),
  stream: (body, { config }) => parseJsonLines({ stream: body, maxEventSize: config.maxEventSize, terminator: config.terminator }),
}

/**
 * The stream media types the generated client registers when the document streams: Server-Sent Events and the JSON
 * Lines family, `application/jsonl`, `application/x-ndjson`, and `application/json-seq` with its `+json-seq` suffixes.
 */
export const streamMediaTypes: MediaTypes = {
  'text/event-stream': eventStream,
  'application/jsonl': jsonLines,
  'application/x-ndjson': jsonLines,
  'application/json-seq': jsonLines,
  'application/*+json-seq': jsonLines,
}
