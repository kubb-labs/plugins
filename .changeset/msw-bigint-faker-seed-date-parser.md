---
'@kubb/plugin-msw': patch
'@kubb/plugin-faker': patch
---

`@kubb/plugin-msw`: a handler sends an `int64` (`bigint`) field as a JSON number, like the generated client does, instead of throwing `Do not know how to serialize a BigInt`. This makes `parser: 'faker'` work with the default `integerType`.

`@kubb/plugin-faker`: `seed: 0` is no longer ignored, and a `dateParser` module name that is not an identifier, such as `'my-date-lib'` or `'@scope/lib'`, is imported and called under a camelCased name.
