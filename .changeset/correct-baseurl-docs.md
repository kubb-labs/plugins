---
'@kubb/plugin-msw': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Correct the `baseURL` doc comment. When `baseURL` is omitted, the generated code uses the operation path only. It does not fall back to the adapter's server URL.
