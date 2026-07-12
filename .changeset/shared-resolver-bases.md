---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Share the resolver naming templates through internal helpers instead of repeating them per plugin. The `param`, `response`, and `file.baseName` templates used by plugin-ts, plugin-zod, and plugin-faker now come from one implementation, and the query/mutation naming used by plugin-react-query, plugin-swr, and plugin-vue-query comes from a shared TanStack Query base. Generated output is unchanged.
