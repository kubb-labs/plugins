---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-mcp': patch
---

Standardize the generated HTTP-client runtime on the export name `client`.

Previously the request function was exported under mismatched names (`fetch` in some places, `client` in others), so with `bundle: true` the generated root barrel emitted `export { client } from './.kubb/client.ts'` while the runtime only exported `fetch`, causing `TS2724`. The runtime now consistently exports `client` across the `fetch` and `axios` adapters, and the bundled client file is always written to `.kubb/client.ts` (react-query, vue-query, and mcp previously wrote `.kubb/fetch.ts`). Generated code imports and calls `client` accordingly.
