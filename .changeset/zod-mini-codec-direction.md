---
'@kubb/plugin-zod': patch
---

With `mini: true`, `printer.nodes` handlers now receive `this.options.direction`. A handler that prints differently per direction now gets an `${name}InputSchema` variant, and request bodies and parameters use the encode output, the same as with the classic printer.
