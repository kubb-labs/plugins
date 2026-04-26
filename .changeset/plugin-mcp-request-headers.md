---
"@kubb/plugin-mcp": patch
---

Fix MCP not passing headers to fetch: the `RequestHandlerExtra` request object is now forwarded from the MCP tool callback to each generated handler function and subsequently to the fetch client call, allowing downstream clients to access headers (auth tokens, traceIds, etc.) from the MCP request context.
