---
"@kubb/plugin-msw": patch
---

Correct the `handlers` JSDoc: the `handlers.ts` file re-exports handlers in operation order, not grouped by HTTP method.
