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

Require Kubb 5.18.0 or later in `kubb-extension.json`. The plugins read the fields the 5.18 adapter adds, so on an older Kubb checks such as `exclusiveMinimum` or an operation's `baseURL` would drop without a warning.
