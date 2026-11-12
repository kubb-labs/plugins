---
'@kubb/plugin-mcp': patch
---

Fix the generated MCP server failing every `tools/list` request when a tool schema holds an `int64` field (`z.bigint()`) or a binary body (`z.instanceof(Blob)`). The tool list now shows an `int64` field as an integer and a binary field as a value without a type. The extension manifest adds the `client` choice for the `client` option, lists `plugin-ts` as optional, and drops the unsupported single-file output mode.
