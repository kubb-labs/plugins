---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Give an operation whose success response offers JSON or a typed `text/event-stream` a `stream: true` overload. `createChat({ body })` returns the JSON result, and `createChat({ body, stream: true })` returns typed events, also through a custom client's `stream` method. When the request body has a boolean `stream` property, the call sets it from the `stream` option and leaves it out of the body type. Before, the operation asked for the stream and returned the raw `ReadableStream`.
