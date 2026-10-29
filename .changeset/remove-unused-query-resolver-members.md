---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Remove `resolver.query.clientName` and `resolver.mutation.typeName`, which no generator called. Overriding them never changed the output, so delete them from a custom `resolver`.
