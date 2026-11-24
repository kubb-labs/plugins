---
"@kubb/plugin-ts": patch
---

Add `| null` to index signatures when an `additionalProperties` value schema is nullable, such as `type: ['integer', 'null']`. Before, `{ [key: string]: number }` rejected valid `null` values.
