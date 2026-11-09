---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix headers, body decoding, errors, and aborts so the fetch and axios clients behave alike.

- Send one `Content-Type` and one `Cookie` header in any letter case, no `Content-Type` without a body, and `Accept: text/event-stream` on a stream call.
- Return text for a non-JSON body labeled JSON, `undefined` for an empty body, and the parsed error body on a failed `blob` or `arraybuffer` call.
- Report `{ status, statusText }` as `error` when a failed call has no body, validate an error body only with `throwOnError: false`, and throw the error an error interceptor returns.
- Reject an aborted call or stream with the signal's reason, also for a `signal` in `options`, and throw a `TypeError` for an object sent as XML, YAML, or CSV without a codec.
- Pass Next.js's `next` option to fetch. On axios, honor `credentials`, return a `Blob` on Node, send typed arrays, and decode a body by its `Content-Type`.
