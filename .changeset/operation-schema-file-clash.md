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

Fix an operation and a schema writing to the same file. When an operation's file in `plugin-ts`, `plugin-zod`, or `plugin-faker` would have the same name as a schema's file, ignoring case, the operation file now gets an `Operation` suffix. For example, operation `point` goes to `types/PointOperation.ts` and `zod/pointOperationSchema.ts`, next to schema `Point` in `types/Point.ts` and `zod/pointSchema.ts`. Clients, query hooks, MSW handlers, Cypress requests, and MCP handlers import from the new path.

Before, the two were merged into one file. In `plugin-zod`, that merged file could import itself through another schema and throw `Cannot access 'pointSchema' before initialization` when loaded. Names that differ only in case, such as operation `office_weatherstory` and schema `OfficeWeatherStory`, overwrote each other on macOS and Windows and failed `tsc` with TS1149.

The exported names in the file stay the same. Specs without such a clash generate the same output as before.
