---
'@kubb/plugin-msw': patch
---

Type a handler's request body as the plain body type, so `{ ...(await request.json()) }` compiles again. A request body with an empty schema still falls back to `DefaultBodyType`.
