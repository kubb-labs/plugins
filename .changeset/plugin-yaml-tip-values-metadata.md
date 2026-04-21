---
"@kubb/plugin-client": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-zod": patch
---

Add `tip` and `values` metadata to union-typed options in all plugin YAML descriptors.

Each option with a `'foo' | 'bar'` type now ships a `values` array documenting what each literal value does, along with a TypeScript code example showing the generated output. Options whose behaviour depends on another option (e.g. `paramsType`/`pathParamsType`) also include a `tip` callout explaining the relationship.

Affected options per plugin:

- **plugin-client**: `client`, `clientType`, `dataReturnType`, `parser`, `paramsType`, `pathParamsType`
- **plugin-ts**: `syntaxType`, `optionalType`, `arrayType`, `enumType`, `enumKeyCasing`
- **plugin-react-query**: `paramsType`, `pathParamsType`, `parser`, `client.clientType`, `client.dataReturnType`
- **plugin-vue-query**: `paramsType`, `pathParamsType`, `parser`, `client.clientType`, `client.dataReturnType`
- **plugin-msw**: `parser`
- **plugin-cypress**: `dataReturnType`, `paramsType`, `pathParamsType`
- **plugin-faker**: `dateParser`, `regexGenerator`
- **plugin-zod**: `importPath`, `dateType`, `guidType`
