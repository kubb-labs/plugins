---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Spread the selected generators into `ctx.addGenerator` so the call matches the narrowed `@kubb/core` signature, which now takes generators as separate arguments instead of a bare array.
