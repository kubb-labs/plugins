---
'@kubb/plugin-mcp': patch
---

Fail the run with a clear error when `@kubb/plugin-zod` is not registered. Before, `server.ts` and `.mcp.json` were skipped without a message and the run still reported success.
