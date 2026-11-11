---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
---

A Server-Sent Events stream whose `data` is a string keeps each value as text, so `42` is no longer read as a number and a string validator passes. A `multipart/mixed` request body with an OpenAPI 3.2 `itemSchema` is typed, validated and mocked as an array of parts. In a response that is either JSON or `text/event-stream`, the stream variant's `data` is typed as `ReadableStream<Uint8Array>`, which is what the client returns.
