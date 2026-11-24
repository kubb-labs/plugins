---
'@kubb/plugin-mcp': minor
---

Give each MCP tool a name that MCP clients accept.

A tool name is the `operationId` with each character outside `[a-zA-Z0-9_-]` replaced by `_`, cut at 64 characters, so `pets.list/v2` becomes `pets_list_v2`. When two operations end up with the same name, the later one gets a `_2` suffix, then `_3`. Override it with `resolver.tool.name`.
