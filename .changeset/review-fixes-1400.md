---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-mcp': patch
---

Fix edge cases in the OpenAPI 3.1 and 3.2 support.

- `multipart/mixed` keeps a part's trailing newline, throws a `ParseError` for a JSON part that is not JSON, and leaves out an `undefined` part.
- A `Date` header passed per call goes out as ISO text, also when the spec declares no header parameters.
- An empty exploded cookie adds no empty `; ` segment.
- An error validator map keyed `'5XX'` still matches, next to the lower case `'5xx'`.
- `RequestResult` and `UnwrappedResult` from `.kubb/client.ts` take the headers type argument.
- Faker keeps exclusive and filled-in bounds on the `multipleOf` grid, and leaves out bigint bounds past the safe integer range.
- Zod leaves out bigint bounds past the safe integer range, which printed as `1e+21n` or a rounded literal.
- MSW sends a serialized Server-Sent Events example once, without wrapping it in `data:` again.
- The primary success response is one with a body, so a `204` next to a `2xx` range no longer hides the body from MCP.
