---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
---

Default generated `options` parameters to `{}` when an operation has no required request data, allowing calls like `getInventory()` without passing an empty object.
