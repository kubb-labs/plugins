---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

An operation whose success response offers JSON or a typed `text/event-stream` gets a `stream: true` overload. `createChat({ body })` returns the JSON result, and `createChat({ body, stream: true })` returns typed events. Before, it returned the raw `ReadableStream`.
