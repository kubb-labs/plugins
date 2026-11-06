# Server-sent events

An operation that returns `text/event-stream` gives you a typed stream of events instead of a `RequestResult`. Kubb takes the event types from the OpenAPI document. The runtime in `.kubb/sse.ts` parses the stream the way the WHATWG event stream specification does.

Each event on the wire has up to four fields, and a blank line ends it:

| Field   | Meaning                                                                          |
| ------- | -------------------------------------------------------------------------------- |
| `event` | The event name. `message` when the server sends none.                            |
| `data`  | The payload. Parsed as JSON unless the document types it as a string.            |
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

## Stream options

Pass these on the call, next to its request params:

| Option         | What it does                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `terminator`   | Ends the stream when `data` equals this value, such as `[DONE]`. Without it, the sentinel reaches your loop.                    |
| `transform`    | Maps each event before validation, for example to camelCase its keys.                                                           |
| `maxEventSize` | Largest event in characters. A larger one throws a `RangeError`. Defaults to `16 * 1024 * 1024`. Set `Infinity` to turn it off. |
| `signal`       | An `AbortSignal` that ends the request and the loop.                                                                            |

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

With `throwOnError: false`, the call resolves instead of throwing, as a regular call does. The result then carries the `status` and the `error` body, its `data` is `undefined`, and its stream yields nothing. Check `data` rather than `error`, because an empty error body leaves `error` undefined. Checking `status` narrows `error` to the body the document declares for that status:

```typescript
const result = await streamChat({ body, throwOnError: false })
if (!result.data) console.error('stream rejected', result.status, result.error)
else for await (const event of result.data) render(event)
```

As on a regular call, `.unwrap()` resolves to the events. A failed call rejects with a `ResponseError` by default, and with the `error` body when the call sets `throwOnError: false`:

```typescript
for await (const event of await streamChat({ body }).unwrap()) render(event)
```

A stream call that gets a JSON response, such as an error body, parses it like any other call, so a 2xx JSON body yields an empty stream. An operation that declares another content type next to `text/event-stream` is generated as a normal call.

Declare heartbeat and `error` events in the document, so each has a `case` in your `switch`.

## Return only the events

With `returnType: 'data'` in the plugin options, a stream call returns its events, as a regular call returns only its body:

```typescript
import { pluginFetch } from '@kubb/plugin-fetch'

pluginFetch({ returnType: 'data' })
```

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

`.kubb/sse.ts` holds the parser, `toEventStream`, and the `ServerSentEvent`, `TypedEvent`, `EventStreamOptions`, and `EventStreamResult` types. A stream operation takes `StreamOptions` and returns `StreamResult`, the stream versions of `Options` and `RequestResult`. Kubb writes it only when the document has a `text/event-stream` operation, and `.kubb/client.ts` then re-exports it, so the types import from either file. Kubb regenerates both on each run, so do not edit them:

```typescript
import type { ServerSentEvent } from './gen/.kubb/client'
```
