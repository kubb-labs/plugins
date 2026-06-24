---
"@kubb/plugin-ts": minor
---

Improve `patternProperties` handling in the TypeScript printer.

- Multiple patterns now contribute their value types to a single index signature instead of only the first pattern being used (`{ [key: string]: string | number }`), with identical value types deduplicated.
- `additionalProperties` and `patternProperties` declared together now merge into one string index signature instead of emitting two, which TypeScript rejects.
- When the object also has fixed properties, the index signature value falls back to `unknown` so it stays assignable from the named properties.

The key regex of `patternProperties` still cannot be expressed by a TypeScript index signature and is dropped, matching how the type is generated elsewhere.
