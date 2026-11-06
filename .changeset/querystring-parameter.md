---
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
---

Read an OpenAPI 3.2 `in: querystring` parameter as the operation's whole query string. A form-encoded object spreads into `query`, so its keys are typed and serialized like query parameters. A JSON one stays one value, sent as the whole query string without its name.
