---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix headers, error values, and axios decoding found by testing both clients and a ky transport against live APIs.

- The operation's content type replaces a `content-type` header you set in lowercase, so the request sends one `Content-Type` instead of two.
- A call that leaves out an optional body sends no `Content-Type`. On axios, a `PATCH`, `POST`, or `PUT` without a body no longer goes out labeled `application/x-www-form-urlencoded`.
- A failed call whose error body is empty but labeled as text, such as `text/html`, reports `{ status, statusText }` as its `error` instead of `''`, so `if (error)` and `.unwrap()` see the failure.
- An error interceptor that returns another error makes the call throw that error. A handler that returns nothing keeps the original `ResponseError`.
- On axios, an aborted call rejects with the signal's reason, such as a `TimeoutError` from `AbortSignal.timeout()`, instead of axios's `CanceledError`, as on fetch.
- On axios in Node, a `Uint8Array` or other typed-array body is sent instead of rejected, and a `Blob` body goes out with the operation's `Content-Type` instead of the Blob's own type.
- On axios, a call without a `responseType` decodes the body by its `Content-Type`, as on fetch. A `text/plain` body that looks like JSON stays text.
- The ky transport example turns off ky's 10-second default timeout.
