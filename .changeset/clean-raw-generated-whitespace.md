---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-mcp": patch
---

Clean up whitespace in the raw generated output (the source emitted before any external formatter runs):

- **react-query / vue-query**: empty conditional fragments (`enabled`, `customOptions`) no longer leave stray blank lines. This removes the double blank line in mutation/query hooks and the blank line that appeared right after `queryOptions<…, typeof queryKey>({`.
- **mcp**: the handler `return { content: […], structuredContent: {…} }` block is now indented at the function-body baseline instead of being over-indented.
