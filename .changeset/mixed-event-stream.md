---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Stream a response that offers `application/json` or `text/event-stream`, such as the Wikimedia EventStreams API.

- The call sends `Accept: text/event-stream`, so axios no longer hangs on an endless JSON body. Pass `contentType: { response: 'application/json' }` for JSON.
- The `text/event-stream` variant of `data` is typed as the `ReadableStream<Uint8Array>` the client returns.
- Kubb writes `.kubb/sse.ts`, so `parseEventStream(result.data)` or `toEventStream(call)` reads the events.
