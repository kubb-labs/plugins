---
"@kubb/plugin-ts": minor
---

Prefix numeric enum keys in `asConst` mode so they are valid identifiers (kubb-labs/plugins#338).

A numeric enum used to emit quoted digit keys in `asConst`, which were only reachable through index access and had no autocomplete:

```ts
export const priority = {
  '1': 1,
  '2': 2,
  '3': 3,
} as const
```

Numeric values now get the PascalCase enum name as a prefix, matching what `enum` mode already does (`Priority_1 = 1`):

```ts
export const priority = {
  Priority_1: 1,
  Priority_2: 2,
  Priority_3: 3,
} as const
```

`enumKeyCasing` still applies on top, so `screamingSnakeCase` produces `PRIORITY_1`. Only the object keys change; the value side and the `typeof` type alias are untouched, and `literal` / `inlineLiteral` are unaffected.

This is a breaking change to the generated output for numeric enums in `asConst` / `asPascalConst` modes.
