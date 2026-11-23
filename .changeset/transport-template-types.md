---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-ky': patch
---

The template types of `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-ky` now use the plugin's own `NativeOptions`, so they match the generated `.kubb/` runtime. `import.meta.resolve('@kubb/plugin-fetch/templates/client.ts')` resolves to the template file again, and so do the same paths in `@kubb/plugin-axios` and `@kubb/plugin-ky`.
