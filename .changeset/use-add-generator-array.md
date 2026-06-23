---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Target `@kubb/core` `5.0.0-beta.74` and register generators in a single `ctx.addGenerator` call now that it accepts multiple generators, dropping the per-generator loop.
