---
'@kubb/plugin-faker': patch
---

A `oneOf` without a declared OpenAPI `discriminator` now infers one when a property carries a
distinct single literal on every branch, narrowing each variant the same way a declared
discriminator already does. Previously every branch indexed against the whole union, widening
that property's literal and making the generated mock fail `tsc` (TS2322) whenever branches
differed in more than that property.
