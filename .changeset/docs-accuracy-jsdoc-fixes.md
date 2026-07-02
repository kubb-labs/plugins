---
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
---

Correct stale JSDoc descriptions so they match the generated output. The vue-query plugin and both query resolvers now describe hooks as `useFoo`/`useFooInfinite` instead of the old `useFooQuery`/`useFooMutation` names, and the MSW handlers generator states that `handlers.ts` re-exports handlers in operation order, not grouped by HTTP method.
