---
'@kubb/plugin-msw': patch
---

Fix handlers that threw or did not compile on real OpenAPI documents.

- Register a handler for a custom method or `TRACE` with `http.all`.
- Send a `text/event-stream` mock as `event:`, `id:`, `retry:` and `data:` lines.
- Generate a `<name>Response2xx` helper for a status range, and make the `data` argument of every response helper optional.
