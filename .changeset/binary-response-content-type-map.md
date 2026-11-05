---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
---

Choose the response parser from each content type when one success response declares more than one. A binary body such as `audio/mpeg` stays a `Blob` when the same response also returns `text/event-stream`, including media types Kubb only knows are binary from `format: binary`. A custom client should accept `responseType` as that map and select the parser from the response `Content-Type`.
