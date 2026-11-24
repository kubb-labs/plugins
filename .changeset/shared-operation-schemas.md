---
"@kubb/plugin-valibot": patch
"@kubb/plugin-react-query": patch
---

Two generators now share code with their siblings, which fixes two small differences.

- `@kubb/plugin-valibot` uses the `description` of a request body for its schema comment, as `@kubb/plugin-zod` does.
- The `HookOptions` type of `@kubb/plugin-react-query` reads `override`, `include` and `exclude` the same way the hook files do. An `override` on `method` matched only the exact case there.
