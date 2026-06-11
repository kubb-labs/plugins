---
"@kubb/plugin-ts": patch
"@kubb/plugin-faker": patch
---

Remove unused code flagged by knip. None of the removed symbols are part of any package's `exports`, and all were unused across the kubb and plugins repos. Runtime behavior is unchanged.

- `@kubb/plugin-ts`: drop the dead `createNamespaceDeclaration`, `createParenthesizedType`, `createNull`, `createIndexedAccessTypeNode`, and `createTypeOperatorNode` factory wrappers (the TypeScript `factory` methods they aliased are still called directly where needed).
- `@kubb/plugin-faker`: drop the redundant `export` on the internal-only `getScalarType`.
