---
'@kubb/plugin-ts': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
'@kubb/plugin-cypress': patch
---

Import names from other plugins with kit's `from` and `code`. plugin-ts marks its resolver `isTypeOnly`, so `from('plugin-ts').resolver` imports its names with `import type`. These plugins now take their imports from `from(plugin).resolver`:

- plugin-msw: its type and faker imports.
- plugin-mcp: its handler and zod schema imports.
- plugin-zod and plugin-valibot: the `InputSchema` imports of the schemas they reference.
- plugin-cypress: its type imports.

Generated output is unchanged.
