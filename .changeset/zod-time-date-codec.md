---
'@kubb/plugin-zod': patch
---

`format: time` fields with `dateType.time: 'date'` now decode a wire `HH:mm:ss` string into a `Date` on `1970-01-01` UTC and encode it back to `HH:mm:ss` on requests, instead of printing `z.date()` both ways and rejecting every real time value. A component whose only `Date` field is a `time` now gets its `InputSchema` variant, and `coercion.dates` no longer turns `time` into `z.coerce.date()`, which cannot parse a bare time.
