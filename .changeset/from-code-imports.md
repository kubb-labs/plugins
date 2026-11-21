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

Import names from other plugins with kit's `from` and `code`. Each plugin marks the imports it uses as types with `import type` itself. These plugins now take their imports from `from(plugin).resolver`:

- plugin-msw: its type and faker imports.
- plugin-mcp: its handler, zod schema and operation type imports.
- plugin-zod and plugin-valibot: the `InputSchema` imports of the schemas they reference.
- plugin-cypress: its type imports, through `from('plugin-ts').import(node, name)`.
- plugin-client: the type and validator schema imports of each operation and SDK class. The SDK's own grouping of imports per file is gone, because `code.join` groups them.
- plugin-react-query, plugin-vue-query and plugin-swr: the hook files' type imports, and react-query's hook options imports.
- The query and MCP plugins: the client `<op>` they call, found through `from(client)` with the client plugin's `exclude`, `include` and `override` rules. A missing client plugin now reports `KUBB_PLUGIN_NOT_FOUND`.
- plugin-msw: the handlers file's imports.
- plugin-faker: the plugin-ts type imports, and the inline `import('…')` type when a faker has the same name as its type.

plugin-ts and `pluginZod({ inferred })` now `provide('types')`. Codec types from zod win over plugin-ts, and plain inferred zod types are the fallback without plugin-ts, as before. The client, query and MCP plugins read operation types through `from('types')` and `getResolver('types')`. Zod-backed types import with `import type`.

Generated output is unchanged.

msw now names its handler files with the resolver's `file.name`, and react-query's resolver says which hook file holds each hook's options. Generators pass only the node to `ctx.file` and `from(…).import(node, name)`. Generated file names are unchanged.

TanStack hook files (react-query, vue-query, swr) and msw handler files are named from the `operationId`, apart from the resolver's `name`, so a `name` override renames hooks and handlers but keeps their files.
