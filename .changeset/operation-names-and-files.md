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

Keep operation names and files apart from each other and from schemas. Specs without such a clash generate the same output as before.

- Give an operation file an `Operation` suffix when it would have the same name as a schema's file, ignoring case. Operation `point` goes to `types/PointOperation.ts` and `zod/pointOperationSchema.ts`, next to schema `Point`. Before, the two were merged into one file, which could throw `Cannot access 'pointSchema' before initialization` or fail `tsc` with TS1149 on macOS and Windows. The exported names stay the same.
- Allocate operation names per source operation instead of per method and path. A plugin's `macros` that change `method` or `path`, such as an MSW macro that turns `GET` into `POST`, no longer make the handler import `FindPetsByStatusResponse2` while `plugin-ts` emits `FindPetsByStatusResponse`.
