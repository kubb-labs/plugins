---
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
---

`plugin-mcp` generates no tool for a stream operation, which returned `{}`, and a form-encoded OpenAPI 3.2 `querystring` parameter imports the zod schema that exists. `plugin-msw` writes an event-shaped Server-Sent Events mock as `event:`, `id:`, `retry:` and `data:` lines, sends a `serializedValue` stream example as it is, and generates a `<name>Response2xx` / `<name>Response4xx` helper for a status range.
