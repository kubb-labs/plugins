---
"@kubb/plugin-ts": minor
"@kubb/plugin-faker": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Move the TypeScript function-parameter model and the `createOperationParams` builder into `@kubb/plugin-ts`, next to `functionPrinter`. `@kubb/plugin-ts` now exports `createFunctionParameter`, `createFunctionParameters`, `createTypeLiteral`, `createIndexedAccessType`, `createObjectBindingPattern`, and `createOperationParams` along with their types. Plugins import these from `@kubb/plugin-ts` instead of `@kubb/ast`, and the `caseParams` helper and `OperationParamsResolver` contract now come from the shared internals. Generated output is unchanged.
