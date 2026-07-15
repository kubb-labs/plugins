---
"@kubb/plugin-ts": patch
---

Omit the `@type` JSDoc tag when it would be the only content of a comment block, since it just repeats the TypeScript type already next to the property.
