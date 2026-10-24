---
'@kubb/plugin-ts': minor
---

Drop the TypeScript compiler dependency. `this.transform` in `printer.nodes` handlers now returns a string. Returning a TypeScript compiler node is deprecated and needs `typescript` 5 or 6, or `@typescript/typescript6`, installed.
