---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-cypress': patch
---

A `'` in a path such as `/Users('{id}')`, in a media type, in a method name or in the MCP server name or version no longer breaks the generated code. Two security requirements on the same scheme with different scopes are both kept. An OpenAPI 3.2 `itemSchema` on a media type the client cannot read as a stream stays a plain call, where the stream call threw `Expected a streamed body`.
