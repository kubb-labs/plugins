---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-client': minor
---

Choose the response parser from each content type when one success response declares more than one. A binary body such as `audio/mpeg` stays a `Blob` when the same response also returns `text/event-stream`, including media types Kubb only knows are binary from `format: binary`.

Custom clients: `responseType` can now be a map from content type to parser, such as `{ 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }`. Widen its type to `string | Record<string, string>` and pick the parser from the response `Content-Type`.
