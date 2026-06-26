---
"@kubb/plugin-ts": minor
---

Render an OpenAPI 3.1 `const` as a literal type.

A `const` is parsed into a single-value enum, so `Status: { const: "active" }` used to generate an `as const` object and a `StatusKey` reference under the default `enum.type`. It now renders the bare literal `export type Status = "active"`, the same way an inline `const` on a property already did. Multi-value enums keep their existing output.
