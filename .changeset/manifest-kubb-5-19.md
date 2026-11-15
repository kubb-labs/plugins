---
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-redoc': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Declare Kubb 5.19.0 or later in `kubb-extension.json`. The plugins have needed 5.19.0 since they started using the store form of `memo`, but the manifest still allowed 5.18.4, so `kubb add` and the compatibility check accepted a Kubb version the plugins fail on.
