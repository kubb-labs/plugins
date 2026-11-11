---
'@kubb/plugin-msw': patch
---

Fix generated handlers that threw or did not compile for operations found in real OpenAPI documents.

- Register a handler for a custom `additionalOperations` method or `TRACE` with `http.all`. It answers its own method only.
- Send an `int64` value, a `bigint`, as a JSON number. `JSON.stringify` threw on it.
- Send a `text/event-stream` mock as one `data:` event, so the generated stream client can read it.
- Compile with `parser: 'faker'` when one success response has a body and another has none.
