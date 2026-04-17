---
"@kubb/plugin-oas": minor
"@kubb/plugin-ts": patch
---

Add `resolveOptions(node, context)` helper that returns effective plugin options for a node after applying `exclude`, `include`, and `override` rules.

- `@kubb/plugin-oas`: Add explicit `options` parameter to `buildOperations`, `buildOperation`, and `buildSchema`
- `@kubb/plugin-ts`: Resolve options inline before each `buildSchema`/`buildOperation` call
