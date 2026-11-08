---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix how both clients read empty, mislabeled, and error response bodies, and stop an aborted stream call before the next event.

- On fetch, a body labeled `application/json` that is not JSON, such as `Pet deleted`, comes back as text instead of throwing a `SyntaxError`.
- On axios, a 204, 205, or 304 returns `undefined` instead of `''`, as on fetch.
- An aborted stream call stops before the next event, so `lastEventId` stays at the last event you read.
- A failed `blob`, `arraybuffer`, or `text` call decodes its error body by content type, so `error` is the parsed object instead of bytes or a string.
- A `*/*` entry in a `responseType` map also applies to a response without a `Content-Type` header.
