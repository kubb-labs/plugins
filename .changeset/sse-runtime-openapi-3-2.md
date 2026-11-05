---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
---

Type server-sent events by name from OpenAPI 3.2 `itemSchema`, parse them as the WHATWG event stream specification does, validate them one by one, and reconnect with `Last-Event-ID`.

- The Server-Sent Events runtime moves to its own generated file, `.kubb/sse.ts`. `.kubb/client.ts` re-exports it, so existing imports keep working.
- An `itemSchema` with one `oneOf` member per event name yields an `EventOf<...>` union, so `switch (event.event)` narrows `data`. An item that describes only the payload keeps `ServerSentEvent<T>`. Events the document does not declare go to `onUnknownEvent` instead of the stream.
- `parseEventStream` dispatches an event only at its blank line and only with `data`, drops an unfinished event at the end, defaults `event` to `message`, carries the last event ID across events until an empty `id` resets it, ignores an `id` with NULL, reads `retry` only when it is all digits, and keeps a `\r` that ends a read.
- With `validator: 'zod'`, the response validator runs per event instead of on the stream body. `transform` maps each event before validation, and `terminator` ends the stream on a sentinel such as `[DONE]`.
- `reconnect` resumes a dropped stream with `Last-Event-ID`, waits the server's `retry` or a growing delay, and stops on abort, `break`, `maxRetries`, a non-2xx response, or a response that is not an event stream. `resume` is required for any method but GET. The result exposes `lastEventId`.
- A JSON answer to a streamed operation, such as an error body, is parsed as a normal response instead of as a stream.
- A custom client module for `@kubb/plugin-client` also exports the `EventOf` and `ServerSentEvent` types.

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
