---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-msw": patch
---

Export the default resolver (`resolverReactQuery`, `resolverVueQuery`, `resolverSwr`, `resolverMsw`) and its type from the package index, matching plugin-ts, plugin-zod, plugin-faker, plugin-mcp, and plugin-cypress. Import it to reference the exact names a plugin generates or to build a custom resolver on top of the defaults.
