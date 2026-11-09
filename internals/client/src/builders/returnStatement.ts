import { getEventStream } from '@internals/shared'
import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '../resolveOperationTypes.ts'
import type { ReturnTypeOption } from '../types.ts'
import { buildRequestResultGenerics, buildResultType } from './generics.ts'

/**
 * Builds the return statement of a generated operation function. The client call takes the responses record and
 * `ThrowOnError` as type arguments, so its result is already the operation's `RequestResult` and needs no cast. With the
 * default `returnType: 'full'` it is wrapped in `withUnwrap`, so the caller can `await` it or call `.unwrap()`. With
 * `returnType: 'data'` it goes through `unwrapResult`, which keeps the success body when the call throws on errors.
 * With `returnType: 'plain'` it is returned as is.
 *
 * @example
 * `return withUnwrap(apiClient<AddPetResponses, ThrowOnError>({ method: 'POST', url: '/pet', ...config }))`
 * @example
 * `return unwrapResult(apiClient<AddPetResponses, ThrowOnError>({ ... }), resolveThrowOnError(config.throwOnError, true))`
 * @example
 * `return apiClient<AddPetResponses, ThrowOnError>({ method: 'POST', url: '/pet', ...config })`
 */
export function buildReturnStatement({
  node,
  types,
  callConfig,
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.OperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): string {
  const call = `apiClient<${buildRequestResultGenerics({ node, types })}>(${callConfig})`
  if (returnType === 'data') return `return unwrapResult(${call}, resolveThrowOnError(config.throwOnError, ${throwOnErrorDefault}))`
  if (returnType === 'plain') return `return ${call}`
  return `return withUnwrap(${call})`
}

/**
 * Builds the return type and statement of a streamed operation, which calls `apiClient.stream`. The item type is
 * `TypedEvent<...>` when each event declares its own `event` and `data`, the success type itself for JSON Lines, and
 * otherwise the default, `ServerSentEvent` around the payload, which needs no type argument.
 */
export function buildEventStreamReturn({
  node,
  types,
  callConfig,
  returnType,
  throwOnErrorDefault,
}: {
  node: ast.HttpOperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}): {
  returnType: string
  statement: string
} {
  const shape = getEventStream(node) ?? 'data'
  const responses = types.response.responses(node)
  const success = `SuccessOf<${responses}>`
  const item = { event: `TypedEvent<${success}>`, data: null, line: success }[shape]
  const generics = [responses, 'ThrowOnError', item].filter(Boolean).join(', ')
  const call = `apiClient.stream<${generics}>(${callConfig})`
  if (returnType === 'plain') return { returnType: `Promise<StreamResult<${generics}>>`, statement: `return ${call}` }
  if (returnType === 'data') {
    return {
      returnType: `Promise<UnwrappedStreamResult<${generics}>>`,
      statement: `return unwrapResult(${call}, resolveThrowOnError(config.throwOnError, ${throwOnErrorDefault}))`,
    }
  }
  return { returnType: `Unwrappable<StreamResult<${generics}>>`, statement: `return withUnwrap(${call})` }
}

/**
 * The stream types an operation file imports from the client: the result and options types for `returnType`, and
 * `SuccessOf` with `TypedEvent` for the item type of named events or JSON Lines.
 */
export function buildEventStreamImports({ returnType, typed, line }: { returnType: ReturnTypeOption; typed: boolean; line: boolean }): Array<string> {
  const result = {
    plain: ['Options', 'StreamResult'],
    full: ['StreamOptions', 'Unwrappable', 'StreamResult'],
    data: ['StreamOptions', 'UnwrappedStreamResult'],
  }[returnType]
  return [...result, ...(typed || line ? ['SuccessOf'] : []), ...(typed ? ['TypedEvent'] : [])]
}
