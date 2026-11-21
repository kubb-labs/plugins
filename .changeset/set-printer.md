---
'@kubb/plugin-ts': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
---

Register each plugin's printer with `setPrinter` from `@kubb/kit`. Generators read it as `ctx.printer` and pass per-node options through `printer.with(...)`, so the printer is built once per build instead of once per schema. Generated output is unchanged.

zod and valibot no longer keep a printer or a directional-node cache in the build memo: each printer gets its own cache, and the `buildMemo` printer option is gone.
