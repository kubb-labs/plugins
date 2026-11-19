---
'@kubb/plugin-swr': patch
---

The resolved `group` option is now `null` instead of `undefined` when it is not set, matching the other plugins. This only matters if a custom generator reads `ctx.options.group`.
