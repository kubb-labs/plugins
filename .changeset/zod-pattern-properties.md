---
"@kubb/plugin-zod": minor
---

Add `patternProperties` support to the Zod printer. Objects that declare `patternProperties` now emit `z.record(z.string().regex(<pattern>), <value>)`, so the generated schema validates both the key pattern and the value type. When fixed `properties` are present the records are intersected with the base object (`z.object({...}).and(z.record(...))`), and multiple patterns are intersected together. `additionalProperties` still takes precedence when both are present.
