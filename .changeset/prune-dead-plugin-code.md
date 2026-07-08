---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-axios": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-redoc": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-faker": patch
---

Remove dead code and redundant guards across the plugins. Generated output is unchanged.

- Drop the always-true `hasCursorParam` guard in the infinite-query generators (react-query, vue-query)
- Drop the no-op `.filter(Boolean)` over statically-imported generator lists (react-query, swr, vue-query), and use a conditional spread for the axios dependency list
- Inline single-caller wrappers and collapse redundant conditionals (swr `getQueryOptionsParams`, swr operation-classification guard, vue-query mutation-key params, redoc options bag, cypress import guard, faker single-element `Set` lookups)
