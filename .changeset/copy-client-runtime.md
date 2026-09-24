---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Emit `.kubb/client.ts` with `copy`, so the parser's `extension` option now reaches the runtime imports through the parser `copy` hook added in kubb 5.3.15, instead of a regex over the template. The generated runtime header follows the same import order as other generated files.
