---
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Import `camelCase` and `pascalCase` from `kubb/kit` instead of a copy bundled into each plugin, and compute each resolved name once per build through `this.memo`, with the key prefixes registered in `Kubb.MemoRegistry`. A grouped SDK class whose tag starts with a digit now gets a valid class name. Needs kubb 5.15 or later.
