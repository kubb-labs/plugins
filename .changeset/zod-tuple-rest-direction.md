---
'@kubb/plugin-zod': patch
---

A schema whose only `Date` field sits in a tuple's rest items now gets its `InputSchema` variant, so request bodies encode that field instead of decoding it.
