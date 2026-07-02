---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
---

Fix generated client config for interpolated `baseURL` values. A config such as `baseURL: '${import.meta.env.VITE_API_SERVER}'` now emits a runtime template literal in `.kubb/client.ts` instead of a fixed string, so environment-based base URLs stay dynamic.
