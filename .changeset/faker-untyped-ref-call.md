---
'@kubb/plugin-faker': patch
---

Call a factory without `data` when its `$ref` points to an untyped schema, so a status factory no longer fails with TS2554 against a zero-argument factory.
