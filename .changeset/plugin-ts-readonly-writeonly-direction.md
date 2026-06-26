---
"@kubb/plugin-ts": patch
---

Document that `readOnly` and `writeOnly` are filtered by request or response direction.

`@kubb/plugin-ts` already drops `readOnly` properties from the request type and `writeOnly` properties from every response type at the operation boundary, so a write-only field such as a password never leaks into a response. The `macros` option no longer suggests a hand-written `drop-write-only` macro for behavior that is automatic, and a regression test now locks in the direction filtering for generated operation types.
