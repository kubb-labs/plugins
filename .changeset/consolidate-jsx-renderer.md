---
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Import the renderer as `jsxRenderer` from `@kubb/renderer-jsx`. The `jsxRendererSync` and `jsxRenderer` exports were the same function behind two names, and the next `@kubb/renderer-jsx` major keeps only `jsxRenderer`. Generated output is unchanged.
