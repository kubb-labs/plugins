---
'@kubb/plugin-faker': patch
---

Mocks pass the Zod schema of the same value in more cases: a number keeps to `multipleOf`, and `ipv4`, `ipv6`, `jwt`, `ulid`, `iban`, `duration` and `hostname` strings get a value of that format, where `ipv4` and `ipv6` returned `undefined`. A nullable `allOf` of one scalar `$ref` and a map with `minProperties` now compile.
