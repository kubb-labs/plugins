---
"@kubb/plugin-ts": patch
---

Add `resolveOptions(node, context)` helper that returns effective plugin options for a node after applying `exclude`, `include`, and `override` rules.

- `@kubb/plugin-ts`: Resolve options inline before each `buildSchema`/`buildOperation` call
