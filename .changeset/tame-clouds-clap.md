---
"@kubb/plugin-mcp": patch
---

Fix per-operation handler files ignoring `output.banner`/`output.footer` by resolving and applying them the same way `serverGenerator.tsx` does.
