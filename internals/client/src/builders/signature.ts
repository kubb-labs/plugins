import type { ast } from 'kubb/kit'
import { getRequestGroupOptionality } from '@internals/shared'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import { buildResultType } from './generics.ts'

const declarationPrinter = functionPrinter({ mode: 'declaration' })

/**
 * The pieces of a generated operation function's grouped-options signature.
 */
export type GroupedOptionsSignature = {
  /**
   * The single function parameter: `options: Options<<Name>Options, ThrowOnError>`.
   */
  paramsSignature: string
  /**
   * The function return type: `Unwrappable<RequestResult<<Name>Responses, ThrowOnError>>`.
   */
  returnType: string
  /**
   * The function generics. One per-call `ThrowOnError` flag, defaulting to `true`.
   */
  generics: Array<string>
}

/**
 * Builds the grouped-options signature for one operation: a single `options` object whose `TData`
 * is the `<Name>Options` type, and a `RequestResult` return type keyed to the per-status responses
 * record. There are no positional arguments.
 *
 * The generated file imports `<Name>Options` and `<Name>Responses` and uses them directly, so no
 * per-operation input type has to be emitted. Both names come from `types`, which is `plugin-ts` or
 * `plugin-zod`'s inferred types (see `resolveOperationTypes`).
 */
export function buildGroupedOptionsSignature({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): GroupedOptionsSignature {
  const optionsName = types.response.options(node)
  const { isOptional } = getRequestGroupOptionality(node)

  const paramsSignature =
    declarationPrinter.print(
      createFunctionParameters({
        params: [createFunctionParameter({ name: 'options', type: `Options<${optionsName}, ThrowOnError>`, ...(isOptional ? { default: '{}' } : {}) })],
      }),
    ) ?? ''

  return {
    paramsSignature,
    returnType: buildResultType({ node, types }),
    generics: ['ThrowOnError extends boolean = true'],
  }
}
