---
"@kubb/plugin-mcp": patch
---

Reject `output.mode: 'file'` with a clear setup error instead of crashing generation. `plugin-mcp` always writes `server.ts` and `.mcp.json` as separate files under `output.path`, so single-file output has nowhere to put them; only `output.mode: 'directory'` is supported.
