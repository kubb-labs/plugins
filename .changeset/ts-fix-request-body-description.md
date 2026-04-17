---
"@kubb/plugin-ts": patch
---

Fix missing `@description` JSDoc on request body type aliases. The `requestBody.description` field now takes precedence over `requestBody.schema.description`.
