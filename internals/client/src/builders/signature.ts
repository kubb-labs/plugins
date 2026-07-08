import type { ast } from 'kubb/kit'
import { getRequestGroupOptionality } from '@internals/shared'
import { createFunctionParameter, createFunctionParameters, functionPrinter, type ResolverTs } from '@kubb/plugin-ts'
import { buildRequestResultGenerics } from './generics.ts'

const declarationPrinter = functionPrinter({ mode: 'declaration' })

/**
 * The pieces of a generated operation function's grouped-options signature.
 */
export type GroupedOptionsSignature = {
  /**
   * Name of the per-operation grouped data type, the plugin-ts `<Name>Options` used directly
   * as the function input.
   */
  dataTypeName: string
  /**
   * The single function parameter: `options: Options<<Name>Options, ThrowOnError>`.
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
 * is the plugin-ts `<Name>Options` (carrying a literal `url`), and a `RequestResult` return type
 * keyed to the plugin-ts per-status responses record. There are no positional arguments.
 *
 * The generated file imports `<Name>Options` and `<Name>Responses` and uses them directly, so no
 * per-operation input type has to be emitted.
 */
export function buildGroupedOptionsSignature({ node, tsResolver }: { node: ast.OperationNode; tsResolver: ResolverTs }): GroupedOptionsSignature {
  const optionsName = tsResolver.response.options(node)
  const responsesName = tsResolver.response.responses(node)
  const resultGenerics = buildRequestResultGenerics({ node, tsResolver })
  const { isOptional } = getRequestGroupOptionality(node)

  const paramsSignature =
    declarationPrinter.print(
      createFunctionParameters({
        params: [createFunctionParameter({ name: 'options', type: `Options<${optionsName}, ThrowOnError>`, ...(isOptional ? { default: '{}' } : {}) })],
      }),
    ) ?? ''

  return {
    dataTypeName: optionsName,
    paramsSignature,
    returnType: `Promise<RequestResult<${resultGenerics}>>`,
    generics: ['ThrowOnError extends boolean = true'],
    importedTypeNames: [optionsName, responsesName],
  }
}
