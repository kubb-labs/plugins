---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Stream a response that offers `application/json` or `text/event-stream`, as the Wikimedia EventStreams API does.

- The call sends `Accept: text/event-stream`, so an axios call no longer hangs on an endless JSON body. Pass `contentType: { response: 'application/json' }` to ask for JSON.
- The `text/event-stream` variant of `data` is typed as the `ReadableStream<Uint8Array>` the client returns, not as the event.
- Kubb writes `.kubb/sse.ts` for such a document, so `parseEventStream(result.data)` or `toEventStream(call)` reads the events.
