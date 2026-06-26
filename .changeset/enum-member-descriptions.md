---
'@kubb/plugin-ts': minor
---

Render enum member descriptions as per-member JSDoc.

When the adapter supplies `namedEnumValues` with a `description` (sourced from the `x-enumDescriptions` / `x-enum-descriptions` vendor extensions), the generated `enum`, `const enum`, and `as const` declarations now attach that text as a JSDoc comment on each member, so per-value documentation from the spec carries through to the output.
