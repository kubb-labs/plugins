---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Keep operation names and files apart from each other and from schemas.

- Give an operation file an `Operation` suffix when a schema file has the same name, ignoring case. Operation `point` goes to `types/PointOperation.ts`, next to schema `Point`. The exported names stay the same.
- Name an operation the same in every plugin when a `macros` entry changes its `method` or `path`. The MSW handler no longer imports `FindPetsByStatusResponse2`.
