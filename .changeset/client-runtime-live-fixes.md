---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix how both clients read empty, mislabeled, and error response bodies, and stop an aborted stream call with the abort reason.

- On fetch, a body labeled `application/json` that is not JSON, such as `Pet deleted`, comes back as text instead of throwing a `SyntaxError`.
- On axios, a 204, 205, or 304, and an empty body that is not text, return `undefined` instead of `''`, as on fetch.
- An aborted stream call stops before the next event and rejects with the signal's reason, so `lastEventId` stays at the last event you read.
- A failed `blob` or `arraybuffer` call decodes a JSON or text error body, so `error` is the parsed object. An error with another content type keeps its bytes, and a `text` call keeps its error as text.
- A failed call with an empty body reports `{ status, statusText }` as its `error`, so `if (error)` and `.unwrap()` see the failure.
- A `cookie` header you set in lowercase gets the cookie params appended instead of a second `Cookie` key.
- On fetch, the Next.js `next` option reaches `fetch`. On axios, `credentials` also works when an adapter list or function resolves to fetch.
- A `*/*` entry in a `responseType` map also applies to a response without a `Content-Type` header.
