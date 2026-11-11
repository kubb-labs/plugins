---
'@kubb/plugin-mcp': patch
---

Fix tools that threw or returned nothing.

- Send an `int64` tool result as JSON. A safe value goes out as a JSON number and a larger one as a string, where `JSON.stringify` threw on the `bigint`.
- Generate no tool for a stream operation, which returned `{}`, or for a response that offers a stream next to another type.
- Import the zod schema that exists for a form-encoded OpenAPI 3.2 `querystring` parameter.
