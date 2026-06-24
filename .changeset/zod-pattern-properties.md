---
"@kubb/plugin-zod": minor
---

Add `patternProperties` support to the Zod printer.

- Without fixed `properties`, an object emits `z.record(z.string().regex(<pattern>), <value>)`, so the generated schema validates both the key pattern and the value. Multiple patterns combine into one alternation key regex with a union value.
- With fixed `properties`, the object falls back to `.catchall(<value>)` (value validated, key pattern not), because a regex-constrained `z.record` inside an intersection rejects the fixed keys at runtime.
- `additionalProperties` still takes precedence when both are present.
