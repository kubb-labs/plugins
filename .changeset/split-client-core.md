---
"@kubb/plugin-client": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
"@kubb/plugin-ky": patch
---

Split the generated `.kubb/core.ts` into `core.ts`, `types.ts`, `auth.ts` and `retry.ts`. `.kubb/client.ts` exports the same names as before, so imports from it keep working. Regenerate to get the new files.
