# Server-sent events

Operations returning `text/event-stream` produce a typed stream of events rather than a `RequestResult`. The client switches to the axios fetch adapter for these calls unless you set `adapter` yourself, because the default XHR adapter buffers the whole body. The event types come from the OpenAPI document: OpenAPI 3.2 describes each event with `itemSchema`, and OpenAPI 3.0 and 3.1 describe one event with `schema`. The runtime in `.kubb/sse.ts`, generated only when the document has such an operation, parses the stream the way the WHATWG event stream specification does, yields only the events the document declares, validates them one by one, and can reconnect with `Last-Event-ID`.

## Describe the stream in OpenAPI

A server-sent event is UTF-8 text. Each event has up to four fields, and a blank line ends it:

```text
event: message_delta
id: 42
retry: 5000
data: {"text": "Hel"}

```

| Field   | Meaning                                                                             |
| ------- | ----------------------------------------------------------------------------------- |
| `event` | The event name. `message` when the server sends none.                               |
| `data`  | The payload, often JSON. Several `data` lines join with a newline.                  |
| `id`    | The last event ID. It carries over to the next events and resumes a dropped stream. |
| `retry` | The reconnection delay in milliseconds.                                             |

### Two shapes of an item

Kubb reads each item in one of two shapes, and the generated types follow. The adapter stores the choice on the content node as `stream.shape`, so every plugin sees the same answer.

| Shape   | The item schema                                                                              | What the stream yields                                                                 |
| ------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `event` | Declares `event` or `data`, itself or in a `oneOf` member, so it describes the parsed event. | `EventOf<Item>`: the item as written, plus the `id` and `retry` any event may carry.   |
| `data`  | Declares neither, so it describes only the payload.                                          | `ServerSentEvent<Item>`: `data` typed as the item, next to `event`, `id`, and `retry`. |

Both shapes come from the same wire format. With an `event` shape, this stream:

```text
event: message_delta
id: 7
data: {"text": "Hel"}

event: ping
data: {}

```

yields `{ event: 'message_delta', id: '7', data: { text: 'Hel' } }` and then `{ event: 'ping', id: '7', data: {} }`, and a `switch` on `event` narrows `data`. With a `data` shape, a stream of stock updates:

```text
data: {"symbol": "AAPL", "price": "100.25"}

```

yields `{ event: 'message', data: { symbol: 'AAPL', price: '100.25' } }`, with `data` typed as `StockUpdate`. The sections below show how to write each shape in OpenAPI 3.2 and in 3.0 or 3.1.

### OpenAPI 3.2: one schema per event with itemSchema

OpenAPI 3.2 adds `itemSchema` to a media type. It describes one item of a stream, while `schema` keeps describing the complete body. For `text/event-stream`, the item is the parsed event: `event`, `data`, `id`, and `retry` as strings and an integer. Describe each event name as a `oneOf` member with a `const` on `event`, and describe JSON inside `data` with `contentMediaType` and `contentSchema`:

```yaml
paths:
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
                  - properties:
                      event: { const: message_delta }
                      data:
                        contentMediaType: application/json
                        contentSchema: { $ref: '#/components/schemas/MessageDelta' }
                  - properties:
                      event: { const: ping }
```

Kubb generates one union member per event name, with `data` typed from `contentSchema`, and the stream yields that union:

```typescript
export type StreamChatStatus200 =
  | { data?: MessageDelta; event: 'message_delta'; id?: string; retry?: number }
  | { data?: string; event: 'ping'; id?: string; retry?: number }
```

`@kubb/plugin-zod` generates a `z.discriminatedUnion('event', [...])` for the same response, so `validator: 'zod'` validates each event against its own member.

### A payload-only item

An `itemSchema` without `event` or `data` properties describes only the payload. This is the form the Speakeasy guide uses, and `schema: { type: string }` next to it keeps the document valid for tools that read OpenAPI 3.0 or 3.1:

```yaml
text/event-stream:
  schema:
    type: string
  itemSchema:
    $ref: '#/components/schemas/StockUpdate'
```

The stream then yields `ServerSentEvent<StockUpdate>`, with the payload on `data` and the event name, id, and retry next to it:

```typescript
type ServerSentEvent<TData> = {
  data: TData
  event: string
  id?: string
  retry?: number
}
```

### OpenAPI 3.0 and 3.1: schema is one event

Before 3.2, there is no `itemSchema`. By convention, `schema` on `text/event-stream` describes one event, and Kubb reads it that way. A `oneOf` of event schemas with a `discriminator` on `event` gives the same union as the 3.2 form:

```yaml
text/event-stream:
  schema:
    oneOf:
      - $ref: '#/components/schemas/MessageDeltaEvent'
      - $ref: '#/components/schemas/PingEvent'
    discriminator:
      propertyName: event
```

A `schema` without `event` or `data` properties is a payload-only item, as above. From 3.2 on, `schema` describes the complete stream, so put the item in `itemSchema`.

## Consume a stream

Read the `stream` of the result with `for await`. With an event union, a `switch` on `event` narrows `data`:

```typescript
import { streamChat } from './gen/clients/streamChat'

const { stream } = await streamChat({ body: { prompt: 'Hi' } })

for await (const event of stream) {
  switch (event.event) {
    case 'message_delta':
      render(event.data?.text)
      break
    case 'ping':
      break
  }
}
```

The runtime parses `data` as JSON when it is valid and keeps the raw string otherwise. An event without `data` is never yielded, as the specification requires, and `event` is `message` when the server sent no name.

## Handle unknown events

APIs add event names over time. The stream yields only the names the document declares and skips the rest, so every `case` stays exhaustive. Pass `onUnknownEvent` to log or inspect what was skipped:

```typescript
const { stream } = await streamChat({
  body: { prompt: 'Hi' },
  onUnknownEvent: (event) => console.warn('unknown event', event.event),
})
```

A payload-only stream declares no names, so nothing is filtered.

## End on a sentinel

Some APIs end a stream with a `data` value that is not JSON, such as `[DONE]`. Pass `terminator` to end the stream when `data` equals that value:

```typescript
const { stream } = await streamCompletions({ body, terminator: '[DONE]' })
```

Without `terminator`, the sentinel reaches your loop as a string, so the payload type has to allow it.

## Stop early

Break out of the loop to stop reading. The runtime cancels the underlying reader when the iterator finishes, so an early `break` releases the connection:

```typescript
for await (const event of stream) {
  if (event.event === 'done') break
  render(event.data)
}
```

To stop a stream from outside the loop, pass an `AbortSignal` and abort it. Aborting ends the request, the iteration, and any pending reconnect:

```typescript
const controller = new AbortController()
const { stream } = await streamChat({ body, signal: controller.signal })

// elsewhere, for example on component unmount
controller.abort()
```

## Read the response

Read the status and headers from the native `response` of the first connection before iterating:

```typescript
const { stream, response } = await streamChat({ body })

console.info(response.status) // 200
console.info(response.headers['x-stream-id'])
```

## Transform and validate events

With `validator: 'zod'` in the plugin options, the response validator runs on each event instead of on the stream body. An event union validates the whole event, a payload-only item validates `data`. A failing event calls `onValidationError`, as any other validation failure does. When the handler returns a value the stream continues with it, otherwise the loop throws a `ParseError`:

```typescript
const { stream } = await streamChat({
  body,
  onValidationError: (error, { value }) => {
    console.warn(error.issues)
    return { value }
  },
})
```

`transform` maps each event before validation. It is the only place to rename keys, for example from snake_case to camelCase, because response interceptors only see the `Response`:

```typescript
const { stream } = await streamChat({
  body,
  transform: (event) => ({ ...event, data: camelCaseKeys(event.data) }),
})
```

Set `validate: false`, or `validate: { response: false }`, to skip the validator for one call. See [Handle errors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/error-handling) for the validation options.

## Reconnect with Last-Event-ID

A dropped connection ends the loop. Pass `reconnect` to resume the stream the way `EventSource` does: the runtime waits, sends the last event ID in a `Last-Event-ID` header, and continues yielding from the new connection. Reconnect is off by default, because many request and response streams, such as a chat completion, end on purpose.

```typescript
const result = await streamChat({
  body,
  reconnect: {
    maxRetries: 2,
    initialDelay: 1000,
    maxDelay: 30_000,
    growFactor: 1.5,
    resume: (lastEventId) => ({ method: 'GET', headers: { 'Last-Event-ID': lastEventId } }),
  },
})

for await (const event of result.stream) {
  render(event)
}
console.info(result.lastEventId) // store it to resume from a new page load
```

| Option         | Default | Meaning                                                                                                              |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `maxRetries`   | `2`     | Reconnects after the first connection.                                                                               |
| `initialDelay` | `1000`  | Delay before the first reconnect in milliseconds. The server's `retry` field replaces it.                            |
| `maxDelay`     | `30000` | Longest delay between reconnects.                                                                                    |
| `growFactor`   | `1.5`   | Factor the delay grows by after each reconnect.                                                                      |
| `onClose`      | `false` | Also reconnect after the server closes the stream cleanly, as `EventSource` does.                                    |
| `resume`       | none    | Builds the resume request from the last event ID. Required for any method but GET, which would repeat the operation. |

The runtime stops reconnecting on abort, when you break out of the loop, after `maxRetries`, on a non-2xx response, and on a response that is not an event stream, such as a `204`. The defaults match the MCP TypeScript SDK's Streamable HTTP transport, which resumes a POST stream with a GET and `Last-Event-ID`, as the `resume` example above does.

An empty `id:` field clears the last event ID, so the next reconnect sends no header. An `id` that contains a NULL character is ignored.

## Handle errors

Catch non-2xx responses around the call and the iteration, and rethrow other errors such as connection failures:

```typescript
import { ResponseError } from './gen/.kubb/client'

try {
  const { stream } = await streamChat({ body })
  for await (const event of stream) {
    render(event)
  }
} catch (error) {
  if (!ResponseError.is(error)) throw error
  console.error('stream rejected', error.status)
}
```

A server can answer a streamed operation with JSON, for example an error body. The client parses such a body as a normal response: a non-2xx status still throws a `ResponseError` with the parsed `data`, and a 2xx JSON body yields an empty stream.

Servers often send a heartbeat event such as `ping` every few seconds and an `error` event when something goes wrong. Declare both in the document, so the heartbeat has a type and the error reaches your `switch` instead of `onUnknownEvent`.

## Limit event size

The parser keeps an event in memory until the blank line that ends it. When one event grows past `maxEventSize` characters, counting each line break as one, the loop throws a `RangeError` and the runtime cancels the stream. The default is 16,777,216 characters (`16 * 1024 * 1024`). Comment lines are dropped, so they do not add to the event's size, but each one must still fit within the limit.

Pass `maxEventSize` per call to raise or lower the limit, or `Infinity` to turn it off:

```typescript
const { stream } = await streamChat({ body, maxEventSize: 64 * 1024 * 1024 })

try {
  for await (const event of stream) {
    render(event)
  }
} catch (error) {
  if (!(error instanceof RangeError)) throw error
  console.error('event too large', error.message)
}
```

## The runtime files

`.kubb/sse.ts` holds the parser, `toEventStream`, and the `ServerSentEvent`, `EventOf`, `EventStreamOptions`, and `Reconnect` types. Kubb writes it only when the document has a `text/event-stream` operation, so a document without streams gets no stream runtime. Import the types from there when you need them:

```typescript
import type { ServerSentEvent } from './gen/.kubb/sse'
```

Both `.kubb/sse.ts` and `.kubb/client.ts` are regenerated on each run, so do not edit them.
