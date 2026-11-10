---
'@kubb/plugin-ts': minor
'@kubb/plugin-zod': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-msw': minor
'@kubb/plugin-mcp': patch
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write a status range in lower case in generated code. A spec's `2XX` response is now named `ListPetsStatus2xx` (`listPetsStatus2xxSchema` in zod) and keyed `'2xx'` in the responses record, the `validator.error` map and the typed headers. `SuccessStatusCode` in `.kubb/core.ts` lists `'2xx'` instead of `'2XX'`, so a hand-written responses record keyed `'2XX'` needs `'2xx'`. After you regenerate, rename imports of the old `…Status2XX` names.
