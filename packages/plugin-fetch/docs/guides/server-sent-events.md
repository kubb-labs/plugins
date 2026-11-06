# Server-sent events

An operation that returns `text/event-stream` gives you a typed stream of events instead of a `RequestResult`. Kubb takes the event types from the OpenAPI document. The runtime in `.kubb/sse.ts` parses the stream the way the WHATWG event stream specification does.

Each event on the wire has up to four fields, and a blank line ends it:

| Field   | Meaning                                                                |
| ------- | ---------------------------------------------------------------------- |
| `event` | The event name. `message` when the server sends none.                  |
| `data`  | The payload. Parsed as JSON unless the document types it as a string.  |
| `id`    | The last event ID. It carries over to later events and resumes a drop. |
| `retry` | The reconnect delay in milliseconds.                                   |

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

In OpenAPI 3.2, put one `oneOf` member per event name on `itemSchema`, with a `const` on `event`. Describe JSON inside `data` with `contentMediaType` and `contentSchema`:

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
                - properties:
                    event: { const: message_delta }
                    data:
                      contentMediaType: application/json
                      contentSchema: { $ref: '#/components/schemas/MessageDelta' }
                - properties:
                    event: { const: ping }
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

The stream yields only the event names the document declares, so the `switch` stays exhaustive when the API adds a name. Pass `onUnknownEvent` to see what it skips:

```typescript
const { stream } = await streamChat({ body, onUnknownEvent: (event) => console.warn('unknown event', event.event) })
```

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

Read `data` straight from each event. The native `response` of the first connection sits next to the stream:

```typescript
import { streamPetEvents } from './gen/clients/streamPetEvents'

const { stream, response } = await streamPetEvents({ path: { petId: 1 } })
console.info(response.status) // 200

for await (const { data } of stream) {
  console.info(data.type, data.pet.name) // PetEvent
}
```

## Stream options

Pass these on the call, next to its request params:

| Option           | What it does                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `terminator`     | Ends the stream when `data` equals this value, such as `[DONE]`. Without it, the sentinel reaches your loop.              |
| `onUnknownEvent` | Receives each event whose name the document does not declare.                                                             |
| `transform`      | Maps each event before validation, for example to camelCase its keys.                                                     |
| `maxEventSize`   | Largest event in characters. A larger one throws a `RangeError`. Defaults to `16 * 1024 * 1024`; `Infinity` turns it off. |
| `signal`         | An `AbortSignal` that ends the request, the loop, and any pending reconnect.                                              |
| `reconnect`      | Resumes a dropped stream. See [Reconnect](#reconnect).                                                                    |

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

Set `validate: false` on the call or the client to skip it. See [Handle errors](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/error-handling) for the validation options.

## Reconnect

A dropped connection ends the loop. Pass `reconnect` to resume the way `EventSource` does: the runtime waits, sends the last event ID as `Last-Event-ID`, and keeps yielding. It is off by default, because many streams, such as a chat completion, end on purpose.

```typescript
const result = await streamChat({ body, reconnect: { resume: () => ({ method: 'GET' }) } })

for await (const event of result.stream) render(event)

console.info(result.lastEventId) // store it to resume after a page load
```

| Option       | Default | Meaning                                                                            |
| ------------ | ------- | ---------------------------------------------------------------------------------- |
| `maxRetries` | `2`     | Reconnects after the first connection.                                             |
| `delay`      | `1000`  | Milliseconds before the first reconnect. The server's `retry` replaces it.         |
| `maxDelay`   | `30000` | Longest the growing delay gets. The server's `retry` is used as sent.              |
| `growFactor` | `1.5`   | Factor the delay grows by after each reconnect.                                    |
| `onClose`    | `false` | Also reconnect after the server closes the stream cleanly.                         |
| `resume`     | none    | Builds the resume request from the last event ID. Required for any method but GET. |

The runtime stops reconnecting on abort, `break`, `maxRetries`, the `terminator`, a non-2xx response, or a response that is not an event stream. It owns the `Last-Event-ID` header: a header you pass on the call seeds the ID, and an empty `id:` from the server clears it.

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

A JSON answer, such as an error body, is parsed as a normal response, so a 2xx JSON body yields an empty stream. An operation that declares another content type next to `text/event-stream` is generated as a normal call. Declare heartbeat and `error` events in the document, so they reach your `switch` instead of `onUnknownEvent`.

## The runtime file

`.kubb/sse.ts` holds the parser, `toEventStream`, and the `ServerSentEvent`, `TypedEvent`, `EventStreamOptions`, and `ReconnectOptions` types. Import the types from there, and do not edit the file, because Kubb regenerates it on each run:

```typescript
import type { ServerSentEvent } from './gen/.kubb/sse'
```
