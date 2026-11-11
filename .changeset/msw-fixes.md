---
'@kubb/plugin-msw': patch
---

Fix generated handlers that threw or did not compile for operations found in real OpenAPI documents.

- Register a handler for a custom `additionalOperations` method or `TRACE` with `http.all`. It answers its own method only.
- Send an `int64` value, a `bigint`, as a JSON number, and print the replacer only when the response has one.
- Send a `text/event-stream` mock as `event:`, `id:`, `retry:` and `data:` lines, and a `serializedValue` stream example as it is.
- Call the handler's own `...Response<status>` helper, whose `data` argument is now optional, and generate a `<name>Response2xx` helper for a status range.
- Leave out a declared `Content-Type` response header, and compile with `parser: 'faker'` when one success response has a body and another has none.
