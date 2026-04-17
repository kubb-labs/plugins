---
"@kubb/plugin-ts": minor
---

Add `legacy` option for backwards-compatible (v4) naming conventions.

When `legacy: true`, uses `resolverTsLegacy` with old naming:
- Response status: `<OperationId><StatusCode>` (e.g. `CreatePets201`)
- Request body: `<OperationId>MutationRequest` / `<OperationId>QueryRequest`
- Responses wrapper: `<OperationId>Mutation` / `<OperationId>Query`
