---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
---

Type server-sent events by name from OpenAPI 3.2 `itemSchema`, parse them as the WHATWG event stream specification does, validate them one by one, and reconnect with `Last-Event-ID`.

- The server-sent events runtime moves to its own generated file, `.kubb/sse.ts`, written only when the document has a `text/event-stream` operation. Import `ServerSentEvent` and `toEventStream` from there instead of from `.kubb/client.ts`.
- An `itemSchema` with one `oneOf` member per event name yields a `TypedEvent<...>` union, so `switch (event.event)` narrows `data`. An item that describes only the payload keeps `ServerSentEvent<T>`. When the document declares event names, any other event goes to `onUnknownEvent` instead of the stream.
- `parseEventStream` follows the WHATWG event stream specification: an event without `data` is not yielded, an event the server does not end with a blank line is dropped, `event` defaults to `message`, and an empty `id` clears the last event ID. `data` stays text when the document types it as a string.
- With `validator: 'zod'`, the response validator runs per event instead of on the stream body. `transform` maps each event before validation, and `terminator` ends the stream on a sentinel such as `[DONE]`.
- `reconnect` resumes a dropped stream with `Last-Event-ID`, waits the server's `retry` or a growing delay, and stops on abort, `break`, `maxRetries`, a non-2xx response, or a response that is not an event stream. `resume` is required for any method but GET. The result exposes `lastEventId`.
- A JSON answer to a streamed operation, such as an error body, is parsed as a normal response instead of as a stream.
- A custom client module for `@kubb/plugin-client` must also export the `TypedEvent` type.

```ts
const { stream } = await streamChat({
  body,
  terminator: '[DONE]',
  reconnect: { resume: (lastEventId) => ({ method: 'GET', headers: { 'Last-Event-ID': lastEventId } }) },
})

for await (const event of stream) {
  if (event.event === 'message_delta') render(event.data)
}
```
