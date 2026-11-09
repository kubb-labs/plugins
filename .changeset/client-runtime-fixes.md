---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Make the fetch and axios clients handle headers, bodies, errors, and aborts the same way.

- Send `Content-Type` and `Cookie` once in any letter case, skip `Content-Type` without a body, and send `Accept: text/event-stream` on a stream call.
- Return text for a non-JSON body labeled JSON, `undefined` for an empty body, and the parsed error body on a failed `blob` or `arraybuffer` call.
- Report `{ status, statusText }` as `error` for a failed call without a body, validate an error body only with `throwOnError: false`, and throw what an error interceptor returns.
- Reject an aborted call or stream with the signal's reason, and throw a `TypeError` for an object sent as XML, YAML, or CSV without a codec.
- On fetch, pass Next.js's `next` option. On axios, honor `credentials`, return a `Blob` on Node, send typed arrays, and decode a body by its `Content-Type`.
