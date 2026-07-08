---
"@kubb/plugin-react-query": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-msw": patch
---

Deduplicate generation logic into shared helpers. Generated output is unchanged.

- react-query: extract `classifyOperation`, `buildResponseTypes`, and `resolvePageParamType` from blocks that were copied across every generator and the query and infinite components
- zod: extract `buildResponseUnion` from the near-identical success and error union blocks in the operation generator
- plugin-ts: hoist the duplicated `resolveImportName` closure in the type generator to one module-level helper
- msw: merge `MockWithFaker` into `Mock` behind an optional `fakerName` prop
