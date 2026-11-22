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
'@kubb/plugin-faker': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-ky': patch
---

Import names from other plugins with kit's `from`, `provide` and `code`, instead of looking up each plugin's files. Each plugin marks the imports it uses as types with `import type` itself.

- plugin-ts and `pluginZod({ inferred })` provide the `types` name. Codec types from zod win over plugin-ts, and plain inferred zod types are the fallback without plugin-ts, as before. The client, query and MCP plugins read operation types from `types`.
- plugin-msw: its type, faker and handler imports.
- plugin-mcp: its handler, zod schema and operation type imports.
- plugin-zod and plugin-valibot: the `InputSchema` imports of the schemas they reference.
- plugin-cypress, plugin-client, plugin-faker and the TanStack hook files: their type imports, and the client's validator schema imports.
- The query and MCP plugins find the client `<op>` they call with the client plugin's `exclude`, `include` and `override` rules. A missing client plugin now reports `KUBB_PLUGIN_NOT_FOUND`.

A resolver `name` override now renames TanStack hooks (react-query, vue-query, swr) and msw handlers, but no longer their files. Those files are named from the `operationId`. Named imports in generated files now list their names in alphabetical order.
