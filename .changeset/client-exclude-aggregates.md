---
'@kubb/plugin-mcp': patch
'@kubb/plugin-react-query': patch
---

Leave out an operation that the client plugin excludes. The MCP `server.ts` registered a handler, and the react-query `HookOptions` type listed a hook, for an operation whose file was never written, so the output did not compile.
