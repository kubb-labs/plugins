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

Read an OpenAPI 3.2 `in: querystring` parameter as the operation's whole query string. A form-encoded object spreads into `query`, so its keys are typed and serialized like query parameters. A JSON one stays one value, sent as the whole query string without its name.
