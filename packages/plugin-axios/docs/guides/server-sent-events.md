# Server-sent events

An operation that returns `text/event-stream` gives you a typed stream of events instead of a `RequestResult`. In the browser, stream calls use the axios fetch adapter, because the default XHR adapter buffers the whole body. An `adapter` set on the call or on `getAxiosInstance()` is kept, and in Node the http adapter streams with its proxy and agent settings. Kubb takes the event types from the OpenAPI document. The runtime in `.kubb/sse.ts` parses the stream the way the WHATWG event stream specification does.

Each event on the wire has up to four fields, and a blank line ends it:

| Field   | Meaning                                                                          |
| ------- | -------------------------------------------------------------------------------- |
| `event` | The event name. `message` when the server sends none.                            |
| `data`  | The payload. Parsed as JSON when it is valid JSON, and kept as text otherwise.   |
| `id`    | The last event ID. It carries over to later events and resumes a dropped stream. |
| `retry` | The reconnect delay in milliseconds.                                             |

## Pick a shape

Kubb reads the stream's item schema in one of two shapes, and the item's properties decide which:

::field-group

:::field{name="event"}
For several named events, such as `message_delta` and `ping`. The item declares `event` or `data`, and the stream yields `TypedEvent<Item>`. See [Typed events](#typed-events).
:::

:::field{name="data"}
For one payload on every event, such as a feed of pet changes. The item declares neither, and the stream yields `ServerSentEvent<Item>`. See [Payload only](#payload-only).
:::

::

`examples/advanced` shows both shapes: `streamOrderEvents` is typed by event, and `streamPetEvents` is typed by payload.

## Typed events

### Describe it

In OpenAPI 3.2, put one `oneOf` member per event name on `itemSchema`, with a `const` on `event`. Point `data` at the payload schema with `$ref`. A `data` string described with `contentMediaType: application/json` and `contentSchema` is typed and parsed as that schema too:

```yaml
/chat:
  post:
    operationId: streamChat
    responses:
      '200':
        description: One event per oneOf member
        content:
          text/event-stream:
            itemSchema:
              type: object
              required: [event]
              properties:
                data: { type: string }
                event: { type: string }
                id: { type: string }
                retry: { type: integer, minimum: 0 }
              oneOf:
                - type: object
                  required: [event, data]
                  properties:
                    event: { type: string, const: message_delta }
                    data: { $ref: '#/components/schemas/MessageDelta' }
                - type: object
                  required: [event]
                  properties:
                    event: { type: string, const: ping }
                    data: { type: string }
```

In OpenAPI 3.0 and 3.1, put the same `oneOf` on `schema`, with a `discriminator` on `event`. Kubb reads `schema` as one event.

### The stream

```text
event: message_delta
id: 1
data: {"text": "Hel"}

event: ping
data: keep-alive

```

This stream yields two events. The `id` carries over to the second one:

```typescript
{ event: 'message_delta', id: '1', data: { text: 'Hel' } }
{ event: 'ping', id: '1', data: 'keep-alive' }
```

### Use it

Kubb generates one union member per event name:

```typescript
export type StreamChatStatus200 =
  | { data?: MessageDelta; event: 'message_delta'; id?: string; retry?: number }
  | { data?: string; event: 'ping'; id?: string; retry?: number }
```

A `switch` on `event` narrows `data` in each `case`:

```typescript
import { streamChat } from './gen/clients/streamChat'

const { stream } = await streamChat({ body: { prompt: 'Hi' } })

for await (const event of stream) {
  switch (event.event) {
    case 'message_delta':
      render(event.data?.text) // MessageDelta
      break
    case 'ping':
      break
  }
}
```

The stream yields every event the server sends. An event name the document does not declare reaches the `default` of your `switch`, and with `validator: 'zod'` the event schema rejects it, as it would any other response that does not match the document.

## Payload only

### Describe it

Point `itemSchema` at the payload. Keep `schema: { type: string }` next to it, so tools that read OpenAPI 3.0 or 3.1 still accept the document:

```yaml
/pet/{petId}/events:
  get:
    operationId: streamPetEvents
    responses:
      '200':
        description: Server-Sent Events stream of pet changes
        content:
          text/event-stream:
            schema:
              type: string
            itemSchema:
              $ref: '#/components/schemas/PetEvent'
```

In OpenAPI 3.0 and 3.1, a `schema` without `event` or `data` properties has the same shape.

### The stream

```text
data: {"type": "updated", "pet": {"id": 1, "name": "Rex"}}

data: {"type": "deleted", "pet": {"id": 1, "name": "Rex"}}

```

This stream yields two events. The server sends no `event`, so each one is named `message`:

```typescript
{ event: 'message', data: { type: 'updated', pet: { id: 1, name: 'Rex' } } }
{ event: 'message', data: { type: 'deleted', pet: { id: 1, name: 'Rex' } } }
```

### Use it

Each event is a `ServerSentEvent<PetEvent>`:

```typescript
type ServerSentEvent<TData> = { data: TData; event: string; id?: string; retry?: number }
```

Read `data` straight from each event. The result also holds the native `response` of the first connection:

```typescript
import { streamPetEvents } from './gen/clients/streamPetEvents'

const { stream, response } = await streamPetEvents({ path: { petId: 1 } })
console.info(response.status) // 200

for await (const { data } of stream) {
  console.info(data.type, data.pet.name) // PetEvent
}
```

## JSON Lines

An operation whose only success content type is a JSON sequence, such as `application/jsonl`, `application/x-ndjson`, or `application/json-seq`, streams one item per line. Each line is parsed as JSON, so the loop gets each item as soon as its line arrives instead of waiting for the whole body. An `application/json-seq` record must fit on one line; a record that spans several lines fails to parse.

### Describe it

Point `itemSchema` at the schema of one line:

```yaml
/logs:
  get:
    operationId: streamLogs
    responses:
      '200':
        description: One LogEntry per line
        content:
          application/jsonl:
            itemSchema:
              $ref: '#/components/schemas/LogEntry'
```

In OpenAPI 3.0 and 3.1, `schema` on one of these media types describes one line.

### The stream

```text
{"level": "info", "message": "started"}
{"level": "warn", "message": "slow"}
```

The call asks for the declared media type in `Accept`. A line may end with CRLF, CR, or LF, blank lines are skipped, and a last line without a line break still counts. A line that is not valid JSON throws a `SyntaxError` from the loop.

### Use it

Each item is a `LogEntry`, with no event wrapper:

```typescript
import { streamLogs } from './gen/clients/streamLogs'

for await (const entry of await streamLogs()) {
  console.info(entry.level, entry.message) // LogEntry
}
```

`terminator`, `maxEventSize`, and `signal` work per line. `transform` only applies to Server-Sent Events. With `validator: 'zod'`, the validator runs on each line. `lastEventId` stays empty, since JSON Lines has no event IDs.

## Stream options

Pass these on the call, next to its request params:

| Option         | What it does                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `terminator`   | Ends the stream when `data` equals this value, such as `[DONE]`. Without it, the sentinel reaches your loop, or fails the `validator` when it does not match the event schema. |
| `transform`    | Maps each event before validation, for example to camelCase its keys.                                                                                                          |
| `maxEventSize` | Largest event in characters. A larger one throws a `RangeError`. Defaults to `16 * 1024 * 1024`. Set `Infinity` to turn it off.                                                |
| `signal`       | An `AbortSignal` that ends the request and the loop.                                                                                                                           |
| `eventShape`   | What the validator checks: `data` for the payload, `event` for the whole event. Generated calls set it.                                                                        |

To stop reading, `break` out of the loop. The runtime then cancels the reader and releases the connection.

## Validate events

With `validator: 'zod'` in the plugin options, the validator runs on each event: the whole event for typed events, `data` for a payload. A failing event calls `onValidationError`. Return `{ value }` to keep going, or the loop throws a `ParseError`:

```typescript
const { stream } = await streamChat({
  body,
  onValidationError: (error, { value }) => {
    console.warn(error.issues)
    return { value }
  },
})
```

Set `validate: false` on the call or the client to skip it. See [Handle errors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/error-handling) for the validation options.

## Read the response headers

A stream result carries the response `headers`, as a regular result does. When the response declares headers, such as an `X-Request-ID`, the call returns `StreamResultWithHeaders`, so `headers.get` suggests their names for the narrowed `status`:

```typescript
const result = await streamChat({ body: { prompt: 'Hi' } })

console.info(result.headers.get('X-Request-ID'))
```

## Resume after a drop

A dropped connection ends the loop with the transport's error. The result's `lastEventId` is the `id` of the last event the server completed, so a new call with a `Last-Event-ID` header continues where the stream stopped. The runtime does not reconnect by itself, because many streams, such as a chat completion, end on purpose, and the retry policy belongs to your app:

```typescript
let lastEventId = ''

for (let attempt = 0; attempt < 3; attempt++) {
  const result = await streamChat({ body, headers: lastEventId ? { 'Last-Event-ID': lastEventId } : {} })
  try {
    for await (const event of result.stream) render(event)
    break
  } catch (error) {
    if (ResponseError.is(error)) throw error
    lastEventId = result.lastEventId || lastEventId
  }
}
```

`lastEventId` is empty until the server sends an `id`, and an empty `id:` field clears it. An `id` that contains a NULL character is ignored. Each event carries the server's `retry` hint as `retry`.

## Handle errors

A non-2xx response throws a `ResponseError`, from the call or from the loop:

```typescript
import { ResponseError } from './gen/.kubb/client'

try {
  const { stream } = await streamChat({ body })
  for await (const event of stream) render(event)
} catch (error) {
  if (!ResponseError.is(error)) throw error
  console.error('stream rejected', error.status)
}
```

With `throwOnError: false`, the call resolves instead of throwing, as a regular call does. The result then carries the `status` and the `error` body, its `data` is `undefined`, and its stream yields nothing. Check `data` to tell the two apart. An empty error body sets `error` to `{ status, statusText }`. Checking `status` narrows `error` to the body the document declares for that status:

```typescript
const result = await streamChat({ body, throwOnError: false })
if (!result.data) console.error('stream rejected', result.status, result.error)
else for await (const event of result.data) render(event)
```

As on a regular call, `.unwrap()` resolves to the events. A failed call rejects with a `ResponseError` by default, and with the `error` body when the call sets `throwOnError: false`:

```typescript
for await (const event of await streamChat({ body }).unwrap()) render(event)
```

A stream call that gets a JSON error body parses it like any other call. A 2xx answer that is not an event stream, such as a JSON body, throws a `TypeError` with the body as its `cause`, and an empty 2xx answer ends as an empty stream. An operation that declares another content type next to `text/event-stream` or a JSON Lines type is a normal call. See [JSON or an event stream](#json-or-an-event-stream).

Declare heartbeat and `error` events in the document, so each has a `case` in your `switch`.

## JSON or an event stream

Some APIs, such as Wikimedia EventStreams, declare the same response as `application/json` and as `text/event-stream`. Kubb generates a normal call for it, which returns a `RequestResult`. The call sends `Accept: text/event-stream`, so the server streams events. To ask for JSON, pass `contentType: { response: 'application/json' }`. Wikimedia answers JSON with an endless JSON Lines body, so also pass `parseAs: 'stream'` and read `result.data` with `parseJsonLines({ stream: result.data })` from `.kubb/client`. Without it, the call waits for a body that never ends.

Check `contentType` on the result. For `text/event-stream`, `data` is the raw `ReadableStream<Uint8Array>`. Pass it to `parseEventStream` from `.kubb/client` to read the events:

```typescript
import { parseEventStream } from './gen/.kubb/client'
import { getV2StreamRecentchange } from './gen/clients/getV2StreamRecentchange'

const result = await getV2StreamRecentchange({ signal })

if (result.contentType === 'text/event-stream') {
  for await (const { data } of parseEventStream(result.data)) render(data)
} else {
  render(result.data) // the JSON body
}
```

To get a stream result with `lastEventId`, send the same request with `client.stream`. It throws a `TypeError` when the server answers with JSON:

```typescript
import { client } from './gen/.kubb/client'

const result = await client.stream({ method: 'GET', url: '/v2/stream/recentchange', eventShape: 'data', signal })
for await (const event of result) render(event.data)
```

## Stream with the client

`client.stream(config)` runs the same interceptors and transport as `client(config)`. On a 2xx answer, it reads the body item by item and validates each item with `validator.response`. A non-2xx body is decoded whole, so `error` stays a value. Type it with the responses record, `ThrowOnError`, and the item type, which defaults to `ServerSentEvent` around the success body:

```typescript
import { client, type SuccessOf } from './gen/.kubb/client'
import type { StreamLogsResponses } from './gen/models/StreamLogs'

const result = await client.stream<StreamLogsResponses, true, SuccessOf<StreamLogsResponses>>({ method: 'GET', url: '/logs' })
```

To stream another format, register a `stream` handler, as [Configure serialization](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization#add-a-media-type) shows.

## Return only the events

With `returnType: 'data'` in the plugin options, a stream call returns its events, as a regular call returns only its body:

```typescript
import { pluginAxios } from '@kubb/plugin-axios'

pluginAxios({ returnType: 'data' })
```

Both modes read the same events. The table compares them for one call:

|                                                | `returnType: 'full'` (default)                                 | `returnType: 'data'`                                           |
| ---------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| The call returns                               | `Unwrappable<StreamResult<…>>`                                 | `Promise<UnwrappedStreamResult<…>>`                            |
| Call it                                        | `const result = await streamPetEvents({ path: { petId: 1 } })` | `const events = await streamPetEvents({ path: { petId: 1 } })` |
| Loop over the events                           | `for await (const event of result.stream)`                     | `for await (const event of events)`                            |
| Other ways to loop                             | `result`, `result.data`, or `.unwrap()`                        | none                                                           |
| `event.data`                                   | `PetEvent`                                                     | `PetEvent`                                                     |
| A failed call, by default                      | throws a `ResponseError`                                       | throws a `ResponseError`                                       |
| With `throwOnError: false`                     | the full result                                                | the full result, as in `'full'`                                |
| `status`, `headers`, `response`, `lastEventId` | available                                                      | only with `throwOnError: false`                                |

Loop over the events the call resolves to:

```typescript
import { streamOrderEvents } from './gen/clients/streamOrderEvents'
import { streamPetEvents } from './gen/clients/streamPetEvents'

const events = await streamOrderEvents({ path: { orderId: 7 } })

for await (const event of events) {
  if (event.event === 'order_placed') render(event.data) // Order
}

for await (const { data } of await streamPetEvents({ path: { petId: 1 } })) {
  console.info(data.type) // PetEvent
}
```

A failed call throws a `ResponseError` before the first event, and a dropped connection throws from the loop:

```typescript
import { ResponseError } from './gen/.kubb/client'

try {
  for await (const event of await streamPetEvents({ path: { petId: 1 } })) render(event)
} catch (error) {
  if (!ResponseError.is(error)) throw error
  console.error('stream rejected', error.status)
}
```

With `throwOnError: false`, the call returns the full result instead, as a regular call does in this mode. The events are its `data` on a 2xx response, and checking `status` narrows `error`:

```typescript
const result = await streamPetEvents({ path: { petId: 1 }, throwOnError: false })

if (!result.data) console.error('stream rejected', result.status, result.error)
else for await (const event of result.data) render(event)
```

The events alone carry no `response` or `lastEventId`. To resume a dropped stream, use the default `returnType: 'full'`, or pass `throwOnError: false` to get the full result.

## The runtime files

`.kubb/sse.ts` holds `parseEventStream`, `parseJsonLines`, and the `eventStream`, `jsonLines`, and `streamMediaTypes` media types. The `ServerSentEvent`, `TypedEvent`, `EventStreamOptions`, `StreamOptions`, `StreamResult`, and `StreamResultWithHeaders` types live in `.kubb/core.ts`. A stream operation takes `StreamOptions` and returns `StreamResult`, or `StreamResultWithHeaders` when the response declares headers, the stream versions of `Options`, `RequestResult`, and `RequestResultWithHeaders`. Kubb writes `sse.ts` only when the document has a JSON Lines operation or an operation that offers `text/event-stream`, and `.kubb/client.ts` re-exports it, so everything imports from the client. Kubb regenerates these files on each run, so do not edit them:

```typescript
import type { ServerSentEvent } from './gen/.kubb/client'
```
