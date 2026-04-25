---
"@kubb/plugin-zod": patch
---

Fix unreachable code in getter when discriminator property overrides external schema with description.

When a discriminator property references an external schema with a description and is overridden with a literal/enum value, the printer now correctly skips applying the description from the original ref to the overridden value. This prevents generating unreachable code after return statements in getters.

Fixes #15
