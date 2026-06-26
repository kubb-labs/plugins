---
"@kubb/plugin-ts": patch
---

Always render a single-value enum as a literal type.

A one-member enum is really a constant: an OAS 3.1 `const`, or a discriminator value like `SUV`'s `type`. It now renders as a bare literal (`type?: "SUV"`), with no runtime enum object or `...Key` alias, no matter the `enum.type` option or whether the adapter registered its name. Before, a registered single-member enum fell back to a runtime enum (`SUVTypeEnum` plus `SUVTypeEnumKey`). Multi-value enums are unchanged.
