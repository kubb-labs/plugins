---
'@kubb/plugin-ts': minor
---

Render enum member descriptions as per-member JSDoc.

Enum schemas can document each value through the `x-enumDescriptions` / `x-enum-descriptions` vendor extensions. When `adapter-oas` supplies those labels on `namedEnumValues`, the generated `enum`, `const enum`, and `as const` declarations now carry each one as JSDoc on the matching member, so the per-value docs from the spec end up in the generated code. Members without a description are left untouched.
