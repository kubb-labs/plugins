---
'@kubb/plugin-client': patch
---

Export the client runtime as `fetch` for both bundled and non-bundled output so the generated root barrel re-export is valid. Previously, with `client: 'fetch'` and `bundle: true`, the barrel emitted `export { client } from './.kubb/client.ts'` while the runtime only exported `fetch`, causing `TS2724`.
