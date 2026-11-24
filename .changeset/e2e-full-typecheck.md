---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-zod': patch
---

Fix generated code that did not compile for some real-world specs.

- An operation named `query`, `body`, `headers`, `path` or `cookies` no longer shadows its own client function in a hook or an MCP handler. The client is imported under an alias, such as `import { query as queryRequest }`.
- A Cypress request keeps a `{placeholder}` in the URL as written when the spec declares no path parameter for it. Before, it read a key that does not exist on `path`.
- An `allOf` Zod schema keeps only the enum values every member allows, like the TypeScript type. Before, a discriminator mapping key missing from the member's own enum made the Zod schema wider than the type.
