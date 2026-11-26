---
'@kubb/plugin-client': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-ky': patch
---

Operations and SDK methods no longer write their return type. TypeScript infers it from the call. A custom client (`returnType: 'plain'`) keeps it.
