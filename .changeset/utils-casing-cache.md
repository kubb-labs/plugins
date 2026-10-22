---
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Cache the results of `camelCase` and `pascalCase`. A build resolves the same names many times, about 35,000 calls from `@kubb/plugin-ts` and `@kubb/plugin-zod` alone for a spec with 1,000 schemas, and each call ran four regular expressions. The cache holds up to 10,000 entries and then starts over.
