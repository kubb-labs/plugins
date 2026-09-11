---
'@kubb/plugin-zod': patch
---

`format: time` fields with `representation: 'date'` decode a wire time string into a `Date` and encode it back to `HH:mm:ss`. A component whose only convertible field is `time` emits an `InputSchema` variant, matching `date` and `date-time`.
