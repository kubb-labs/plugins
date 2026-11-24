---
'@kubb/plugin-faker': patch
---

Report a `pattern` that JavaScript cannot compile as a `KUBB_INVALID_SPEC` diagnostic that names the pattern. It was a bare `SyntaxError`. A `never` schema now prints `undefined`.
