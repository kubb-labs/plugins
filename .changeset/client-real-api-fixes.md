---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix client behavior found by calling real APIs with the fetch, axios, and ky clients:

- An array or object header parameter without a `style` in the document goes out in the OpenAPI default `simple` style (`X-Ids: 3,4`), as the serialization guide says. Before, it was sent as JSON.
- `client.stream` sends `Accept: text/event-stream` when the call sets no `Accept`, so the server streams events instead of answering with JSON.
- A stream call that cannot read its body as a stream cancels the body before it throws, which releases the connection.
- `HttpMethod` includes `TRACE`, so a generated `trace` operation typechecks. `fetch` and ky still reject `TRACE`. Use `@kubb/plugin-axios` or a custom transport for it.
- On axios, aborting a call while its raw streamed body is read rejects with the signal's reason instead of axios's `CanceledError`, as on fetch.
- On axios, a string or untyped body sent without a content type no longer goes out labeled `application/x-www-form-urlencoded`. `FormData`, `URLSearchParams`, and a typed `Blob` keep their own type.
