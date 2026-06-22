---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-mcp": patch
---

Bundle the private internal helper packages into the published output instead of declaring them as runtime dependencies. The published packages no longer reference workspace-only packages that are not on npm, and the release step can version the plugins again.
