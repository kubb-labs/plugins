---
"@kubb/plugin-client": patch
---

Fix type mismatch when `parser: 'zod'` is used with date coercion. The request body generic on the generated `request<>` call now uses `z.output<typeof schema>` instead of the TypeScript input type, so schemas with transforms (e.g. `Date → string` for `coercion: { dates: true }`) no longer cause a `Type 'string' is not assignable to type 'Date'` error. A `import type { z } from 'zod'` is added to generated client files that have a Zod request schema.
