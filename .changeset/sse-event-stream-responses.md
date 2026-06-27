---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Support Server-Sent Events (`text/event-stream`) responses in the generated client.

An operation whose primary success response is `text/event-stream` now generates a function that returns a typed event stream instead of a one-shot result. Both the fetch and axios clients share the same syntax:

```ts
const { stream } = await streamEvents({ ...options })

for await (const event of stream) {
  console.log(event.data) // typed from the operation's event schema, JSON-parsed when it is JSON
}
```

Under the hood the call sets `responseType: 'stream'` and the runtime exposes `parseEventStream`, `toEventStream`, `EventStreamResult`, and `ServerSentEvent`. The parser handles the SSE wire format (`data:`, `event:`, `id:`, `retry:`), concatenates multi-line `data`, ignores comment and heartbeat lines, normalizes CRLF, keeps non-JSON `data` as a string, and stops when an `AbortSignal` aborts. It reads a web `ReadableStream` (fetch) or any async iterable of byte chunks (the axios stream response).

Non-streaming operations are unchanged. Requires `@kubb/adapter-oas` and `@kubb/ast` with response `content` support.
