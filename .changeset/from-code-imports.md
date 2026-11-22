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


Plugins now import each other's names with kit's `from`, `provide` and `code`, instead of looking up each plugin's files.

What changes for users:

- A resolver `name` override renames TanStack hooks (react-query, vue-query, swr) and msw handlers, but no longer their files. Those files are named from the `operationId`.
- Named imports list their names in alphabetical order.
- A query or MCP plugin without its client plugin in the config reports `KUBB_PLUGIN_NOT_FOUND`.

How operation types are found:

- plugin-ts and `pluginZod({ inferred })` provide the `types` name, and the client, query and MCP plugins read their operation types from it.
- Codec types from zod win over plugin-ts. Plain inferred zod types are the fallback without plugin-ts, as before.
