---
"@kubb/plugin-client": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
---

Build the generated client call arguments with `ast.factory` and the shared function printer instead of the bespoke `createFunctionParams` helper, and share one `buildClientOptionType` helper for the `client?:` hook option across the query plugins. Internal refactor; generated output is unchanged.
