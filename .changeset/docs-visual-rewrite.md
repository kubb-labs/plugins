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

Rewrite the docs each plugin ships for kubb.dev to lead with tables, steps, and examples instead of long prose. The axios and fetch plugins merge their base URL, authentication, and interceptor guides into one `configure-requests` guide, and the client plugin's authentication guide moves into `write-your-client`. Option types and defaults are checked against the code.
