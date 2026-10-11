---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
---

Fail the run with a clear error when `client` is not `'fetch'` or `'axios'`. Before, an unknown value was ignored and the registered client plugin was picked silently.
