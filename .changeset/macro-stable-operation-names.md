---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Fix a plugin's `macros` that change an operation's `method` or `path` giving other plugins' names a numeric suffix. For example, a macro on `plugin-msw` that turns `GET` into `POST` made the handler import `FindPetsByStatusResponse2` and `createFindPetsByStatusResponse2`, while `plugin-ts` and `plugin-faker` emit `FindPetsByStatusResponse` and `createFindPetsByStatusResponse`.

Operation names are now allocated per source operation (its input `pointer`), which a macro keeps, instead of per method and path. Specs without such a macro generate the same output as before.
