---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

An operation whose success response offers JSON or a typed `text/event-stream` gets two overloads. `createChat({ body, stream: true })` returns typed events, and `createChat({ body, stream: false })` returns the JSON result. `createChat({ body })` is unchanged.
