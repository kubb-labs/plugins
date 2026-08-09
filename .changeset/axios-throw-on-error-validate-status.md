---
"@kubb/plugin-axios": patch
---

Fix the generated axios client resolving non-2xx responses instead of rejecting them when `throwOnError: true` and no custom `validateStatus` is provided. Axios treats an explicitly passed `validateStatus: undefined` as accepting every status, so the client now falls back to an explicit 2xx-only validator in that case, restoring the `ResponseError` rejection the generated types promise.
