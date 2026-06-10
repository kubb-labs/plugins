---
"@kubb/plugin-zod": patch
---

Fix cross-file input schema refs being emitted as default imports. When a codec schema (e.g. a `date` field with `dateType: 'date'` or `coercion.dates`) is referenced from another file, the generated input import now renders as a named import (`import { recordLocationInputSchema } from './recordLocationSchema'`) instead of a default import, resolving the `TS2613` "Module has no default export" error reported in kubb-labs/kubb#3508.
