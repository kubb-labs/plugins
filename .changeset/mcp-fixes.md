---
'@kubb/plugin-mcp': patch
---

Fix tools that threw or returned nothing.

- Generate no tool for a stream operation, which returned `{}`, or for a response that offers a stream next to another type.
- Import the zod schema that exists for a form-encoded OpenAPI 3.2 `querystring` parameter.
