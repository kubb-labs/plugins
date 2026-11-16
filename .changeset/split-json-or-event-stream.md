---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Split an operation whose success response offers JSON or a typed `text/event-stream` into two calls. `createChat` returns the JSON result, and `createChatStream` returns typed events, also through a custom client's `stream` method. When the request body has a boolean `stream` property, each call sets it to `false` or `true` and leaves it out of its options type. Before, the operation was one call that asked for the stream and returned the raw `ReadableStream`.
