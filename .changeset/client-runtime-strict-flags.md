---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

The generated `.kubb/` runtime now type-checks with `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` and `isolatedDeclarations`. Optional fields that the runtime passes as `undefined` accept `undefined`, and `client`, `createClient` and `defaultConfig` have explicit types.
