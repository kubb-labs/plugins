---
"@kubb/plugin-client": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Consume the shared codegen helpers (`stringify`, `trimQuotes`, `jsStringEscape`, `toRegExpString`,
`stringifyObject`, `getNestedAccessor`, `buildJSDoc`) from `@kubb/ast/utils` instead of keeping
local copies in `@internals/utils`. Generated output is unchanged.
