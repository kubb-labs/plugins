---
'@kubb/plugin-ts': patch
---

Simplify the internal `functionPrinter` so it no longer goes through `ast.createPrinterFactory`.

The printer only ever dispatches one level deep (a parameter list to its parameters), so the generic printer-factory machinery and the internal `defineFunctionPrinter` hook are gone in favor of two plain functions. `functionPrinter` and `renderType` keep the same public surface, and generated output is unchanged.
