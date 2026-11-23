---
'@kubb/plugin-ts': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-valibot': minor
'@kubb/plugin-cypress': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-client': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-ky': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
---

Write files with kit templates instead of generators, and stop using deprecated kit APIs. Generated output does not change.

- Each plugin registers its templates with `addTemplate`. The exported ones are `typeSchema` and `typeOperation` (plugin-ts), `fakerSchema` and `fakerOperation`, `valibotSchema` and `valibotOperation`, `cypressOperation`, and `mcpOperation` and `serverOperations` (plugin-mcp). Another plugin can register them or call their `render`.
- `typeGenerator`, `fakerGenerator`, `valibotGenerator`, `cypressGenerator`, `mcpGenerator` and `serverGenerator` are deprecated. They still work and run the templates.
- The user's `macros` option goes to `addMacro` instead of the deprecated `setMacros`.
- `setupClient` no longer reads `name`, which is now optional and deprecated.
