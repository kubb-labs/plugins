---
"@kubb/plugin-ts": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Remove unused exports flagged by Fallow. Internal `factory.ts` helpers in `@kubb/plugin-ts` are now module-private, and the plugin `utils.ts` files no longer re-export helpers nothing imports. None of these symbols were part of a package's public `exports` map, so consumers are unaffected.
