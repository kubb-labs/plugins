---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Make the fetch and axios clients handle headers, bodies, errors, and aborts the same way.

- Send `Content-Type` and `Cookie` once in any letter case, no `Content-Type` without a body, and `Accept: text/event-stream` on a stream call.
- Return text for a non-JSON body labeled JSON, `undefined` for an empty body, and the parsed error body on a failed `blob` or `arraybuffer` call.
- A failed call without a body reports `{ status, statusText }` as `error`. An error body is validated only with `throwOnError: false`, and the error an error interceptor returns is thrown.
- An aborted call or stream rejects with the signal's reason. An object sent as XML, YAML, or CSV without a codec throws a `TypeError`.
- Fetch passes Next.js's `next` option. Axios honors `credentials`, returns a `Blob` on Node, sends typed arrays, and decodes a body by its `Content-Type`.
