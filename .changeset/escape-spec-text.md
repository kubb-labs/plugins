---
'@kubb/plugin-client': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
---

Escape text from the OpenAPI document before it reaches generated code.

- A description or summary with `*/` no longer closes the JSDoc block of an SDK class method, and a line that starts with `@` no longer becomes a JSDoc tag.
- A path with a backtick, a backslash or `$` stays text in the MSW handler URL and the Cypress request URL.
- A property name with a quote is quoted in the `.omit()` mask of a zod schema.
- A parameter `style`, a response status key and the `nextParam`, `cursorParam` and `queryParam` keys are quoted. An `explode` or `allowReserved` that is not a boolean is left out.
- A faker enum whose values are objects lists them as JSON, not as `[object Object]`.
- A faker import that is renamed after a name collision only renames its calls, so a property key of the same name stays.
