---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
---

Correct stale JSDoc: hook names carry no `Query`/`Mutation` suffix (`useFoo`, `useFooSuspense`, `useFooInfinite`), `customOptions.importPath` is a named import, and the `validator` docs describe the real `false | 'zod' | { request?, response? }` behavior instead of the removed `'client'` value.
