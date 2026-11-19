import { ast } from '@kubb/kit'
import { printParams } from '@kubb/renderer-jsx'
import { legacyFunctionPrinter } from './printers/functionPrinter.ts'
import type { FunctionPrinterOptions } from './printers/functionPrinter.ts'

/** @deprecated Use `ast.factory` from `@kubb/kit` and `printParamType` from `@kubb/renderer-jsx`. Removed in Kubb v6. */
export const { createFunctionParameter, createFunctionParameters, createIndexedAccessType, createObjectBindingPattern, createTypeLiteral } = ast.factory
export { printParamType as renderType } from '@kubb/renderer-jsx'

// Aliases of the `ast` node types from `@kubb/kit`, removed in Kubb v6.
export type FunctionParameterNode = ast.FunctionParameterNode
export type FunctionParametersNode = ast.FunctionParametersNode
export type IndexedAccessTypeNode = ast.IndexedAccessTypeNode
export type ObjectBindingPatternNode = ast.ObjectBindingPatternNode
export type TypeExpression = ast.TypeExpression
export type TypeLiteralNode = ast.TypeLiteralNode

/** @deprecated Pass the node to the `params` prop of `Function`, or call `printParams` from `@kubb/renderer-jsx`. Removed in Kubb v6. */
export function functionPrinter(options: FunctionPrinterOptions) {
  if (options.transformName || options.transformType) return legacyFunctionPrinter(options)
  return {
    name: 'functionParameters' as const,
    options,
    print: (node: ast.FunctionParametersNode): string => printParams(node, options.mode),
  }
}
