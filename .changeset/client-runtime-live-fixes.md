---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix five cases in the client runtime.

- The fetch transport returns a body labeled `application/json` that is not JSON as text, instead of throwing a `SyntaxError`.
- The axios transport returns `undefined` for a 204, 205, or 304, as the fetch transport does. It returned `''`.
- A stream call stops at its `signal` before the next event, so `lastEventId` stays at the last event you saw.
- A `responseType: 'blob'`, `'arraybuffer'`, or `'text'` call decodes its error body by content type, so `error` is the error object instead of bytes or a string.
- A `*/*` entry in a `responseType` map applies to a response without a `Content-Type` header.
