---
'@kubb/plugin-faker': patch
---

Mocks pass the Zod schema of the same value in more cases: a number keeps to `multipleOf`, and `ipv4`, `ipv6`, `jwt`, `ulid`, `iban`, `duration` and `hostname` strings get a value of that format, where `ipv4` and `ipv6` returned `undefined`. A nullable `allOf` of one scalar `$ref` and a map with `minProperties` now compile. A mock of a schema whose `allOf` member is part of a cycle keeps that member's properties, and a `oneOf` with a member in a cycle no longer returns `undefined`.
