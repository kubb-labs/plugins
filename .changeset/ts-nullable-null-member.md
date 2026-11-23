---
'@kubb/plugin-ts': patch
---

Print a nullable union with a `null` member as `Foo | null` instead of `Foo | (null | null)`. This covers OpenAPI 3.1 `oneOf` or `anyOf` with `{ type: 'null' }`, and OpenAPI 3.0 `nullable: true` with `allOf`.
