---
'@kubb/plugin-msw': patch
---

Mock a `text/json` response as JSON, like `application/json`. The plugins now read media types, status codes, servers and auth through the `ast.mediaType`, `ast.http`, `ast.server` and `ast.auth` helpers from `@kubb/kit`.
