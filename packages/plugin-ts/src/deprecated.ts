import { ast } from '@kubb/kit'
import { legacyFunctionPrinter } from './printers/functionPrinter.ts'
import type { FunctionPrinterOptions } from './printers/functionPrinter.ts'

/** @deprecated Use `ast.factory.createFunctionParameter` from `@kubb/kit`. Removed in Kubb v6. */
export const createFunctionParameter = ast.factory.createFunctionParameter
/** @deprecated Use `ast.factory.createFunctionParameters` from `@kubb/kit`. Removed in Kubb v6. */
export const createFunctionParameters = ast.factory.createFunctionParameters
/** @deprecated Use `ast.factory.createIndexedAccessType` from `@kubb/kit`. Removed in Kubb v6. */
export const createIndexedAccessType = ast.factory.createIndexedAccessType
/** @deprecated Use `ast.factory.createObjectBindingPattern` from `@kubb/kit`. Removed in Kubb v6. */
export const createObjectBindingPattern = ast.factory.createObjectBindingPattern
/** @deprecated Use `ast.factory.createTypeLiteral` from `@kubb/kit`. Removed in Kubb v6. */
export const createTypeLiteral = ast.factory.createTypeLiteral
/** @deprecated Use `ast.params.renderType` from `@kubb/kit`. Removed in Kubb v6. */
export const renderType = ast.params.renderType

/** @deprecated Use `ast.FunctionParameterNode` from `@kubb/kit`. Removed in Kubb v6. */
export type FunctionParameterNode = ast.FunctionParameterNode
/** @deprecated Use `ast.FunctionParametersNode` from `@kubb/kit`. Removed in Kubb v6. */
export type FunctionParametersNode = ast.FunctionParametersNode
/** @deprecated Use `ast.IndexedAccessTypeNode` from `@kubb/kit`. Removed in Kubb v6. */
export type IndexedAccessTypeNode = ast.IndexedAccessTypeNode
/** @deprecated Use `ast.ObjectBindingPatternNode` from `@kubb/kit`. Removed in Kubb v6. */
export type ObjectBindingPatternNode = ast.ObjectBindingPatternNode
/** @deprecated Use `ast.TypeExpression` from `@kubb/kit`. Removed in Kubb v6. */
export type TypeExpression = ast.TypeExpression
/** @deprecated Use `ast.TypeLiteralNode` from `@kubb/kit`. Removed in Kubb v6. */
export type TypeLiteralNode = ast.TypeLiteralNode

/**
 * @deprecated Pass the parameter node to the `params` prop of `Function`, or call `ast.params.print(node, mode)` from `@kubb/kit`. Removed in Kubb v6.
 */
export function functionPrinter(options: FunctionPrinterOptions) {
  if (options.transformName || options.transformType) return legacyFunctionPrinter(options)
  return {
    name: 'functionParameters' as const,
    options,
    print: (node: ast.FunctionParametersNode): string => ast.params.print(node, options.mode),
  }
}
