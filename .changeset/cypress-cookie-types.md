---
'@kubb/plugin-cypress': patch
---

Fix the type error on `value instanceof Date` in a generated request whose cookies are all strings, and send a `style: cookie` parameter without percent-encoding, as the clients do. A request body that is one number, or has no schema type, now compiles, and an `int64` body is sent as a number.
