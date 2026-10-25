---
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
---

A `pattern` that uses `\p{...}`, `\P{...}` or `\u{...}` is now emitted with the `u` flag, so the generated regex compiles and matches the way the spec means.
