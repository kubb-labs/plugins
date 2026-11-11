---
'@kubb/plugin-msw': patch
---

Make a mock handler call its own `...Response<status>` helper, so the response code is printed once. The `data` argument of every response helper is now optional.
