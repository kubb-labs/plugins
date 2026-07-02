---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
---

Remove the inert `validator` option. It never generated validation code: the hooks call the client operation, and the client plugin bakes validation into that operation. Set `validator` on `pluginAxios` or `pluginFetch` instead.

Migration: delete `validator` from `pluginReactQuery`, `pluginVueQuery`, and `pluginSwr`, and set it on the client plugin.
