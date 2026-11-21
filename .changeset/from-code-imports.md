---
'@kubb/plugin-ts': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-client': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Import names from other plugins with kit's `from` and `code`. plugin-ts marks its resolver `isTypeOnly`, so `from('plugin-ts').resolver` imports its names with `import type`. These plugins now take their imports from `from(plugin).resolver`:

- plugin-msw: its type and faker imports.
- plugin-mcp: its handler and zod schema imports.
- plugin-zod and plugin-valibot: the `InputSchema` imports of the schemas they reference.
- plugin-cypress: its type imports, through `from('plugin-ts').file(node)`.
- plugin-client: the type and validator schema imports of each operation and SDK class. The SDK's own grouping of imports per file is gone, because `code.join` groups them.
- plugin-react-query, plugin-vue-query and plugin-swr: the hook files' type imports, and react-query's hook options imports.
- plugin-msw: the handlers file's imports.

Generated output is unchanged.
