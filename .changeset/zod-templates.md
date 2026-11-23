---
'@kubb/plugin-zod': minor
---

Write zod files with kit templates. `zodSchema` writes the file for each schema and `zodOperation` the file for each operation. Both are exported, so another plugin can register them with `addTemplate` or call their `render`.

- `zodGenerator` is deprecated. It still works and runs the two templates.
- The user's `macros` option now goes to `addMacro`, which replaces the deprecated `setMacros`.
- Generated output does not change.
