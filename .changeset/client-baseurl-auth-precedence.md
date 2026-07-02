---
"@kubb/plugin-axios": minor
"@kubb/plugin-fetch": minor
---

Fix two precedence bugs in the client runtime. A `baseURL` passed on a single call now replaces the client-level `baseURL` instead of being concatenated onto it. An explicit header set on a call (such as `Authorization`) now wins over the token the `auth` resolver produces, so per-call overrides behave as documented.
