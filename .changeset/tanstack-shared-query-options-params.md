---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
---

Share the query-options parameter builder across the TanStack plugins. The duplicated `getQueryOptionsParams` body now lives in `@internals/tanstack-query` as `buildQueryOptionsParams`, and each plugin delegates to it (vue-query keeps its `MaybeRefOrGetter` wrapping). No change to generated output.
