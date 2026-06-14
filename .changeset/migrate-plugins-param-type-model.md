---
'@kubb/plugin-ts': major
'@kubb/plugin-client': major
'@kubb/plugin-react-query': major
'@kubb/plugin-vue-query': major
'@kubb/plugin-swr': major
'@kubb/plugin-msw': major
'@kubb/plugin-cypress': major
'@kubb/plugin-faker': major
'@kubb/plugin-mcp': major
---

Migrate the plugins to the reshaped `@kubb/ast` param and type model.

A parameter type is now a plain `string`, so the `ast.createParamsType({ variant: 'reference', name })` wrapper is gone from every component. The query, header, and path grouping helpers (`resolveParamType`, `resolveGroupType`, `buildGroupParam`, `buildTypeLiteral`) are imported from `@kubb/ast` instead of being redefined in `internals/tanstack-query`. The `functionPrinter` keeps two modes, `declaration` and `call`; the `keys` and `values` modes are removed, and a destructured group renders from a single `FunctionParameter` whose name is an `ObjectBindingPattern` and whose type is a `TypeLiteral`. `@kubb/plugin-ts` now exports `renderType` for turning a type expression into source.

Generated output is unchanged.
