---
'@kubb/plugin-msw': patch
---

Type a handler's request body through a local `MswBody<T>` alias, so `{ ...(await request.json()) }` compiles again. A body type that MSW does not accept, such as `unknown`, `bigint` or `void`, still falls back to `DefaultBodyType`.
