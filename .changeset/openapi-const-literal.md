---
"@kubb/plugin-ts": minor
---

Render an OpenAPI 3.1 `const` schema as a literal type instead of a runtime enum.

A `const` is parsed into a single-value enum node, so a named const such as `Status: { const: "active" }` previously generated an `as const` object plus a `StatusKey` reference under the default `enum.type`. It now emits the bare literal `export type Status = "active"` across every `enum.type`, matching the inline (property-level) const that already rendered as a literal. Multi-value enums are unchanged.
