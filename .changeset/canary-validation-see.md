---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
---

`@see` text from an operation's `externalDocs` can no longer start a JSDoc tag, so a description line that starts with `@deprecated` does not mark the generated function as deprecated.
