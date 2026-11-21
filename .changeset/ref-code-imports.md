---
'@kubb/plugin-ts': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-mcp': patch
---

Import names from other plugins with kit's `ref` and `code`. plugin-ts marks its resolver `isTypeOnly`, so `ref('plugin-ts')` imports its names with `import type`. plugin-msw takes its type and faker imports from `ref`, and plugin-mcp takes its handler and zod schema imports from `ref`. Generated output is unchanged.
