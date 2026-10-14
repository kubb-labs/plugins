---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Ship declaration files for the runtime templates. Importing types from `@kubb/plugin-fetch/templates/*` or `@kubb/plugin-axios/templates/*` now resolves to `dist/templates/*.d.ts`, so consumers no longer need `allowImportingTsExtensions` to type-check against them. The copy step still reads the `.ts` templates.
