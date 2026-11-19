# Server-sent events

Consume typed server-sent events and JSON Lines with the generated Axios client. Stop, resume, and handle streaming errors.

Kubb types the items from the OpenAPI document, and `.kubb/sse.ts` parses events as the WHATWG event stream specification does.

## How Kubb detects a stream

Kubb generates a stream call when the success response declares only a stream content type:

| The success response declares                                                              | Each item                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `text/event-stream`, and the item schema declares `event` or `data`                        | `TypedEvent<Item>`, narrowed by `event.event`  |
| `text/event-stream`, with any other item schema                                            | `ServerSentEvent<Item>`, with `Item` in `data` |
| `application/jsonl`, `application/x-ndjson`, `application/json-seq`, or a `+json-seq` type | `Item`, one per line                           |

With `text/event-stream` next to another content type, Kubb generates a normal call instead. See [JSON or an event stream](#json-or-an-event-stream).

The item schema is `itemSchema` in OpenAPI 3.2. In OpenAPI 3.0 and 3.1, `schema` describes one event or one line:

::code-group

```yaml [Typed events]
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

```yaml [Payload only]
/pet/{petId}/events:
  get:
    operationId: streamPetEvents
    responses:
      '200':
        description: One PetEvent per event
        content:
          text/event-stream:
            schema: { type: string } # the whole stream, for tools that do not read itemSchema
            itemSchema: { $ref: '#/components/schemas/PetEvent' }
```

```yaml [JSON Lines]
/logs:
  get:
    operationId: streamLogs
    responses:
      '200':
        description: One LogEntry per line
        content:
          application/jsonl:
            itemSchema: { $ref: '#/components/schemas/LogEntry' }
```

::

In OpenAPI 3.0 and 3.1, put the item schema on `schema` instead: the `PetEvent` reference for a payload, or the same `oneOf` with a `discriminator` on `event` for typed events.

> [!NOTE]
> In the browser, a stream call switches to the axios fetch adapter, because the default XHR adapter buffers the whole body. An `adapter` you set on the call or on `getAxiosInstance()` is kept.

## The generated function

```typescript
export function streamChat<ThrowOnError extends boolean = true>(
  options: StreamOptions<StreamChatOptions, ThrowOnError> = {},
): Unwrappable<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>>
```

A `StreamResult` has the fields of a `RequestResult` for the first connection, plus `stream` and `lastEventId`. The result iterates its items, which are also in `stream` and `data`. With `returnType: 'data'`, the call resolves to the items.

Pass these stream options next to the request params:

| Option         | What it does                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `terminator`   | Ends the stream when an event's `data`, or a JSON line, equals this value, such as `[DONE]`.   |
| `transform`    | Maps each Server-Sent Event before validation, for example to camelCase its keys.              |
| `maxEventSize` | The most characters in one event or line. Default `16 * 1024 * 1024`. `Infinity` turns it off. |
| `signal`       | An `AbortSignal` that ends the request and the loop.                                           |

## Consume items

::code-group

```typescript [Typed events]
import { streamChat } from './gen/clients/streamChat'

for await (const event of await streamChat({ body: { prompt: 'Hi' }, terminator: '[DONE]' })) {
  switch (event.event) {
    case 'message_delta':
      render(event.data.text) // MessageDelta
      break
    case 'ping':
      break
  }
}
```

```typescript [Payload only]
import { streamPetEvents } from './gen/clients/streamPetEvents'

const { stream, response } = await streamPetEvents({ path: { petId: 1 } })
console.info(response.status) // 200

for await (const { data } of stream) console.info(data.type) // PetEvent
```

```typescript [JSON Lines]
import { streamLogs } from './gen/clients/streamLogs'

for await (const entry of await streamLogs()) console.info(entry.level, entry.message) // LogEntry
```

```typescript [returnType: 'data']
// with pluginAxios({ returnType: 'data' })
const events = await streamPetEvents({ path: { petId: 1 } })

for await (const { data } of events) console.info(data.type)
```

::

An event the document does not declare reaches the `default` of your `switch`, so declare heartbeat and `error` events too. For event names, IDs, and JSON Lines limits, see [Event names, IDs, and JSON Lines](#event-names-ids-and-json-lines).

With `validator: 'zod'`, the validator checks each item: the whole event for typed events, `data` for a payload, and each line for JSON Lines. To keep going past a failing item, return `{ value }` from `onValidationError`:

```typescript
const { stream } = await streamChat({ body, onValidationError: (error, { value }) => ({ value }) })
```

## Stop, abort, and resume

- `break` out of the loop to stop. The runtime cancels the reader and releases the connection.
- Pass `signal` to stop from outside. The call or the loop rejects with the signal's reason.
- A dropped connection ends the loop with the transport's error, unless [`retry`](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/configure-requests#retry-a-failed-call) is set.

With `retry`, the runtime retries a failed connect, and reopens a dropped `text/event-stream` with the last event ID in a `Last-Event-ID` header. The limit counts failures in a row: a failed connect and the drops after it count together, and the count starts over once the stream delivers an event. A reopen that fails throws from the loop, after the error interceptors, also with `throwOnError: false`. A stream that ends, a parse error, and a JSON Lines stream are never reopened. A server that ignores `Last-Event-ID` sends its events again from the start.

`streamChat` is a `POST`, which `retry` leaves alone unless `retry.methods` names it:

```typescript
for await (const event of await streamChat({ body, retry: { limit: 3, methods: ['POST'] } })) render(event)
```

To write your own policy, leave `retry` off and resume by hand.

To resume by hand, send a new call with a `Last-Event-ID` header. `lastEventId` is the `id` of the last event the server completed. Declare `Last-Event-ID` as a header parameter, so the call accepts it in `headers`:

```typescript
import { ResponseError } from './gen/.kubb/client'
import { ValidationError } from './gen/.kubb/standardSchema'

async function* resumeChat(attempts = 3) {
  let lastEventId = ''

  for (let attempt = 1; ; attempt++) {
    try {
      const result = await streamChat({ body, headers: lastEventId ? { 'Last-Event-ID': lastEventId } : {} })
      for await (const event of result) {
        lastEventId = result.lastEventId
        yield event
      }
      return
    } catch (error) {
      if (attempt === attempts || ResponseError.is(error) || error instanceof ValidationError) throw error
    }
  }
}

for await (const event of resumeChat()) render(event)
```

The loop retries a failed connect and a dropped connection. It rethrows the last failure, so a cut stream never looks complete. It also rethrows a `ResponseError` and a `ValidationError` at once, because a retry cannot fix them and would skip the failing event. Rethrow your abort reason the same way when you pass `signal`. An error from `render` is thrown outside the generator, so it is never retried.

For cleared IDs and resuming with `returnType: 'data'`, see [Event IDs when you resume](#event-ids-when-you-resume).

## Handle errors

| What happens                                          | Where it fails                                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Non-2xx response                                      | The call throws a `ResponseError`.                                                                 |
| Non-2xx response with `throwOnError: false`           | The call resolves with `status` and `error`. `data` is `undefined`, and the stream yields nothing. |
| 2xx response whose body is not a stream, such as JSON | The call throws a `TypeError` with the body as its `cause`.                                        |
| 2xx response with an empty body                       | No error. The stream is empty.                                                                     |
| Dropped connection or abort                           | The loop throws.                                                                                   |
| An item fails its schema                              | The loop throws a `ValidationError`, unless `onValidationError` returns `{ value }`.               |
| An event is larger than `maxEventSize`                | The loop throws a `RangeError`.                                                                    |
| A JSON line is not valid JSON                         | The loop throws a `SyntaxError`.                                                                   |

```typescript
const result = await streamChat({ body, throwOnError: false })

if (!result.data) console.error('stream rejected', result.status, result.error)
else for await (const event of result.data) render(event)
```

An error thrown from the loop skips `client.interceptors.error`. `.unwrap()` resolves to the items, as on a regular call.

## JSON or an event stream

When the success response declares `text/event-stream` next to another type, such as `application/json`, Kubb generates a normal call that sends `Accept: text/event-stream`. Pass `contentType: { response: 'application/json' }` to ask for JSON. When the server streams, `data` is the raw `ReadableStream<Uint8Array>`, so read it with `parseEventStream`, or `parseJsonLines({ stream })` for JSON Lines:

```typescript
import { parseEventStream } from './gen/.kubb/client'

const result = await getRecentChanges({ signal })

if (result.contentType === 'text/event-stream') {
  for await (const { data } of parseEventStream(result.data)) render(data)
} else {
  render(result.data) // the JSON body
}
```

## Stream with the client

`client.stream(config)` sends a stream request by hand. It runs the same interceptors and transport as `client(config)`, and validates each item with `validator.response`. Type it with the responses record, `ThrowOnError`, and the item type:

```typescript
import { client, type SuccessOf } from './gen/.kubb/client'
import type { StreamLogsResponses } from './gen/types/StreamLogs'

const result = await client.stream<StreamLogsResponses, true, SuccessOf<StreamLogsResponses>>({
  method: 'GET',
  url: '/logs',
  contentType: { response: 'application/jsonl' },
})
```

Without `contentType.response` or an `Accept` header, `client.stream` sends `Accept: text/event-stream`.

The item type defaults to `ServerSentEvent` around the success body. To stream another format, register a `stream` handler, as [Add a media type](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization#add-a-media-type) shows.

Import the stream helpers and types from `.kubb/client`, and do not edit the `.kubb/` files: Kubb rewrites them on each run.

## Less common cases

### JSON in a `data` string

When an event's `data` is a string with `contentMediaType: application/json` and a `contentSchema`, Kubb types and parses it as that schema. See [How Kubb detects a stream](#how-kubb-detects-a-stream) for the item schemas.

### Stream calls in Node.js

When a stream call runs in Node.js, the axios http adapter streams the body, with its proxy and agent settings. Only a browser call with the default adapters switches to the fetch adapter.

### Stream result types

When you type a variable that holds a stream result, the type depends on the response and on `returnType`:

| Setting                                                 | The call returns                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Default                                                 | `Unwrappable<StreamResult<…>>`                                                                |
| The response declares headers                           | `Unwrappable<StreamResultWithHeaders<…>>`, so `headers.get` suggests their names              |
| `returnType: 'data'`                                    | `Promise<UnwrappedStreamResult<…>>`: the items, or the full result with `throwOnError: false` |
| `returnType: 'data'`, and the response declares headers | `Promise<UnwrappedStreamResultWithHeaders<…>>`                                                |

In v5, a stream response that declared headers returned a plain `StreamResult`. [The generated function](#the-generated-function) shows the default signature.

### Stream options Kubb sets

When you call [`client.stream`](#stream-with-the-client) yourself, pass the options a generated stream call gets from the document:

| Option       | What it does                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventShape` | Whether the validator checks the whole event (`'event'`) or its `data` (`'data'`).                                                                                              |
| `rawData`    | Keeps `data` as text, for every event or for a list of event names. Kubb sets it when the document types `data` as a string. Otherwise `data` is parsed as JSON when it parses. |

### Event names, IDs, and JSON Lines

When the server leaves a field out of an event, or sends JSON Lines:

- An event takes `message` as its name when the server sends none.
- The `id` carries over to later events, and `retry` holds the server's reconnect hint.
- A JSON Lines stream has no event IDs, and `transform` does not apply to it.
- An `application/json-seq` record must fit on one line.

### Event IDs when you resume

When you [resume a stream](#stop-abort-and-resume):

- The runtime reconnects only when `retry` is set, because many streams end on purpose.
- `lastEventId` is empty until the server sends an `id`, and an empty `id:` clears it.
- The resume loop copies `lastEventId` after each event, so after a clear it sends no `Last-Event-ID`. A connection that drops before its first event keeps the ID from the connection before.
- With `returnType: 'data'`, the items alone carry no `lastEventId`, so pass `throwOnError: false` to get the full result.

### Interceptors on a stream call

When a response interceptor runs on a stream call, `data` in its `DecodedResponse` is the raw body stream. See [Add interceptors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/configure-requests#add-interceptors).

### Stream runtime files

When you look for a stream helper or type, import it from `.kubb/client`:

- `.kubb/sse.ts` holds `parseEventStream`, `parseJsonLines`, and the stream media types, and `.kubb/client.ts` re-exports it.
- The stream types, such as `ServerSentEvent`, `TypedEvent`, `StreamOptions`, and `StreamResult`, live in `.kubb/core.ts`.
