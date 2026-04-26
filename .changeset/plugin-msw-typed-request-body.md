---
"@kubb/plugin-msw": patch
---

Fix typed request body in generated MSW handler callbacks. When an operation has a request body, the generated handler now passes the request body type as a generic to `http.<method>`, so `info.request.json()` returns the typed payload without requiring a manual cast.
