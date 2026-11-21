---
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
---

Keep the printer and directional-node caches in the build memo through `memo.scope`, and prefix every memo slot with the plugin name, such as `plugin-zod:printer`. Generated output is unchanged.
