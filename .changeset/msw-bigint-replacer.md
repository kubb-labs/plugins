---
'@kubb/plugin-msw': patch
---

Print the `bigint` replacer in a mock's `JSON.stringify` only when the response schema has an `int64` that Kubb types as `bigint`.
