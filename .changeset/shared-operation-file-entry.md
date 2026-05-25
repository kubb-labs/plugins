---
"@kubb/plugin-client": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
---

Replace the `resolver.resolveFile` entry object — duplicated 44 times across the client and query operation generators — with a shared `operationFileEntry(node, name)` helper from `@internals/shared`. The helper returns the same `{ name, extname: '.ts', tag, path }` params, so generated output is unchanged. Internal refactor only.
