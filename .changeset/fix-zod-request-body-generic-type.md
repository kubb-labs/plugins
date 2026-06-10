---
"@kubb/plugin-client": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Fix type mismatch when `parser: 'zod'` is used with request schemas that have transforms. The generated `request<>` call now uses `z.output<typeof schema>` for the request body generic instead of the TypeScript input type, so schemas with transforms (e.g. date coercion: `Date` → `string`) no longer raise `Type 'string' is not assignable to type 'Date'`. Generated files that inline a Zod request schema now include `import type { z } from 'zod'`.
