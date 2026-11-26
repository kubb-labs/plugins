---
'@kubb/plugin-client': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-ky': patch
---

Generated operations and SDK methods no longer write their return type, since the call inside already states the same type. TypeScript infers the same result type, and the generated clients get about a fifth smaller. A custom client (`returnType: 'plain'`) keeps the written return type, which its module has to match. With `isolatedDeclarations` on, exclude the generated folder from it.
