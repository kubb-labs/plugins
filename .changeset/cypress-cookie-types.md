---
'@kubb/plugin-cypress': patch
---

Fix the type error on `value instanceof Date` in a generated request whose cookies are all strings, and send a `style: cookie` parameter without percent-encoding, as the clients do.
