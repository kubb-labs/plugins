---
'@kubb/plugin-ts': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
---

Build each plugin's printer once per build with kit's `setPrinter`, instead of once per schema. Generated output is unchanged.

- Generators read the printer as `ctx.printer` and pass per-node options with `printer.with(...)`.
- Remove the `buildMemo` printer option from zod and valibot. Each printer keeps its own cache.
