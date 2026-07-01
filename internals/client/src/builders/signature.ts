import type { ast } from '@kubb/core'
import { getRequestGroupOptionality } from '@internals/shared'
import { createFunctionParameter, createFunctionParameters, functionPrinter, type ResolverTs } from '@kubb/plugin-ts'
import { buildRequestResultGenerics } from './generics.ts'

const declarationPrinter = functionPrinter({ mode: 'declaration' })

/**
 * The pieces of a generated operation function's grouped-options signature.
 */
export type GroupedOptionsSignature = {
  /**
   * Name of the per-operation grouped data type, the plugin-ts `<Name>RequestConfig` used directly
   * as the function input.
   */
  dataTypeName: string
  /**
   * The single function parameter: `options: Options<<Name>RequestConfig, ThrowOnError>`.
   */
  paramsSignature: string
  /**
   * The function return type: `Promise<RequestResult<<Name>Responses, ThrowOnError>>`.
   */
  returnType: string
  /**
   * The function generics. One per-call `ThrowOnError` flag, defaulting to `true`.
   */
  generics: Array<string>
  /**
   * The plugin-ts type names the generated file imports (type-only).
   */
  importedTypeNames: Array<string>
}

/**
 * Builds the grouped-options signature for one operation: a single `options` object whose `TData`
 * is the plugin-ts `<Name>RequestConfig` (carrying a literal `url`), and a `RequestResult` return type
 * keyed to the plugin-ts per-status responses record. There are no positional arguments.
 *
 * The generated file imports `<Name>RequestConfig` and `<Name>Responses` and uses them directly, so no
 * per-operation input type has to be emitted.
 */
export function buildGroupedOptionsSignature({ node, tsResolver }: { node: ast.OperationNode; tsResolver: ResolverTs }): GroupedOptionsSignature {
  const requestConfigName = tsResolver.resolveRequestConfigName(node)
  const responsesName = tsResolver.resolveResponsesName(node)
  const resultGenerics = buildRequestResultGenerics({ node, tsResolver })
  const { isOptional } = getRequestGroupOptionality(node)

  const paramsSignature =
    declarationPrinter.print(
      createFunctionParameters({
        params: [createFunctionParameter({ name: 'options', type: `Options<${requestConfigName}, ThrowOnError>`, ...(isOptional ? { default: '{}' } : {}) })],
      }),
    ) ?? ''

  return {
    dataTypeName: requestConfigName,
    paramsSignature,
    returnType: `Promise<RequestResult<${resultGenerics}>>`,
    generics: ['ThrowOnError extends boolean = true'],
    importedTypeNames: [requestConfigName, responsesName],
  }
}
