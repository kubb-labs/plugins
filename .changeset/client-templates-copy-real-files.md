---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-client": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-mcp": patch
---

Emit the client templates by copying the real `.ts` files into the generated folder instead of inlining their source as strings at build time. The templates ship as real files and `@kubb/plugin-client` exposes them through `@kubb/plugin-client/templates` (resolved absolute paths for the new `copy` file field) and the `@kubb/plugin-client/templates/*` subpath (the raw files). This replaces the build-time `importAttributeTextPlugin` and the `templates/*.source` wrapper exports. Generated output is unchanged.
