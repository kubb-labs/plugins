---
'@kubb/plugin-ts': patch
---

Fix three type printer details.

- A `printer.nodes` override can call `this.base(node)` to get what the printer would have printed. It ran into `Maximum call stack size exceeded`.
- A union without members prints `never`, like an enum without values. It printed `any`.
- `resolver.enum.keyName(node)` without a suffix adds `Key`, the default of `enum.typeSuffix`. It added `key`.
