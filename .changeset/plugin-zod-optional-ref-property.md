---
"@kubb/plugin-zod": patch
---

Fix optional ref properties not being wrapped in `.optional()` (or `z.optional()` in mini mode) inside `z.object()`. Properties declared with `required: false` were emitted without the optional modifier because the printers checked `schema.optional` instead of `property.required`.
