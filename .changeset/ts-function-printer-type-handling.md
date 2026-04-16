---
"@kubb/plugin-ts": patch
---

Update `functionPrinter` to handle all three `TypeNode` variants (`member`, `struct`, `reference`) explicitly, removing all `typeof … === 'string'` checks.
