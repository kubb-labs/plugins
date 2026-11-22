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

Plugins find their files with kit's `ctx.file` and import each other's names with `from`, `provide` and `code`, instead of looking up each other's paths.

- A resolver `name` override renames TanStack hooks (react-query, vue-query, swr) and msw handlers, but no longer their files. Those files are named from the `operationId`.
- Named imports list their names in alphabetical order.
- A query or MCP plugin without its client plugin in the config reports `KUBB_PLUGIN_NOT_FOUND`.
- Operation types come from plugin-ts, or from `pluginZod({ inferred })`, in the same order as before: codec types first, then plugin-ts, then plain inferred types.
