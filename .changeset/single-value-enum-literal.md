---
"@kubb/plugin-ts": patch
---

Always render a single-value enum as a literal type.

A single-member enum is a constant: an OAS 3.1 `const`, or a one-member discriminator enum such as `SUV`'s `type`. It now renders as a bare literal (`type?: "SUV"`) with no runtime enum object or `...Key` alias, ignoring the `enum.type` option, even when the adapter registered its name as a named enum. Previously such an enum fell back to a named runtime enum (`SUVTypeEnum` + `SUVTypeEnumKey`). Multi-value enums keep their existing output.
