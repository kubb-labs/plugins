---
'@kubb/plugin-mcp': patch
---

Send an `int64` tool result as JSON. With a client that validates with zod, the result holds a `bigint`, and `JSON.stringify` threw on it. A safe value goes out as a JSON number and a larger one as a string, which the tool's output schema reads back.
