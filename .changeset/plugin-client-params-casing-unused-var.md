---
"@kubb/plugin-client": patch
---

Fix unused variable warning when `paramsCasing: 'camelcase'` is combined with `urlType: 'export'`.

When a path parameter contained an underscore (e.g. `item_id`), the generated client emitted an unused `const item_id = itemId` declaration. The mapping variable is now only emitted when the URL is built inline.
