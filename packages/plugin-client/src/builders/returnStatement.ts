import type { ast } from '@internals/ast'
import { getStream } from '@internals/shared'
import { buildResponseHeadersRef, buildResponseHeadersType, buildResultTypeRef, resultTypeName, type OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'
import { buildRequestResultGenerics, buildRequestResultTypeRef } from './generics.ts'

export type BuildReturnStatementOptions = {
  node: ast.OperationNode
  types: OperationTypeNames
  callConfig: string
  returnType: ReturnTypeOption
  throwOnErrorDefault: boolean
}

/**
 * Builds the return statement of a generated operation function. The client call takes the responses record and
 * `ThrowOnError` as type arguments, so its result is already the operation's `RequestResult` and needs no cast. With the
 * default `returnType: 'full'` it is wrapped in `withUnwrap`, so the caller can `await` it or call `.unwrap()`. `withUnwrap`
 * gets its type argument, so TypeScript does not also infer it from the declared return type. With `returnType: 'data'`
 * it goes through `unwrapResult`, which keeps the success body when the call throws on errors. With `returnType: 'plain'`
 * it is returned as is.
 *
 * @example
 * `return withUnwrap<RequestResult<AddPetResponses, ThrowOnError>>(apiClient<AddPetResponses, ThrowOnError>({ method: 'POST', url: '/pet', ...config }))`
 * @example
 * `return unwrapResult(apiClient<AddPetResponses, ThrowOnError>({ ... }), resolveThrowOnError(config.throwOnError, true))`
 * @example
 * `return apiClient<AddPetResponses, ThrowOnError>({ method: 'POST', url: '/pet', ...config })`
 */
export function buildReturnStatement({ node, types, callConfig, returnType, throwOnErrorDefault }: BuildReturnStatementOptions): string {
  const call = `apiClient<${buildRequestResultGenerics({ node, types })}>(${callConfig})`
  if (returnType === 'data') return `return unwrapResult(${call}, resolveThrowOnError(config.throwOnError, ${throwOnErrorDefault}))`
  if (returnType === 'plain') return `return ${call}`
  return `return withUnwrap<${buildRequestResultTypeRef({ node, types })}>(${call})`
}

export type EventStreamReturn = { returnType: string; statement: string }

/**
 * Builds the return type and statement of a streamed operation, which calls `apiClient.stream`. The item type is
 * `TypedEvent<...>` when each event declares its own `event` and `data`, the success type itself for JSON Lines, and
 * otherwise the default, `ServerSentEvent` around the payload, which needs no type argument.
 */
export function buildEventStreamReturn({ node, types, callConfig, returnType, throwOnErrorDefault }: BuildReturnStatementOptions): EventStreamReturn {
  const shape = getStream(node)?.shape ?? 'data'
  const responses = types.response.responses(node)
  const headers = buildResponseHeadersRef({ node, types })
  const success = `SuccessOf<${responses}>`
  const item = { event: `TypedEvent<${success}>`, data: null, line: success }[shape]
  // The headers come after the item in `client.stream`, so a typed-headers call spells out the default item.
  const callItem = item ?? (headers ? `ServerSentEvent<${success}>` : null)
  const call = `apiClient.stream<${[responses, 'ThrowOnError', callItem, headers].filter(Boolean).join(', ')}>(${callConfig})`
  const result = (name: string) => buildResultTypeRef(name, responses, headers, ['ThrowOnError', item])
  if (returnType === 'plain') return { returnType: `Promise<${result('StreamResult')}>`, statement: `return ${call}` }
  if (returnType === 'data') {
    return {
      returnType: `Promise<${result('UnwrappedStreamResult')}>`,
      statement: `return unwrapResult(${call}, resolveThrowOnError(config.throwOnError, ${throwOnErrorDefault}))`,
    }
  }
  return { returnType: `Unwrappable<${result('StreamResult')}>`, statement: `return withUnwrap<${result('StreamResult')}>(${call})` }
}

export type BuildEventStreamImportsOptions = {
  node: ast.OperationNode
  types: OperationTypeNames
  returnType: ReturnTypeOption
}

/**
 * The stream types an operation file imports from the client for one streamed operation: the result and options types
 * for `returnType`, their `WithHeaders` form when the response declares headers, and `SuccessOf` with `TypedEvent` or
 * `ServerSentEvent` for an item type the call spells out.
 */
export function buildEventStreamImports({ node, types, returnType }: BuildEventStreamImportsOptions): Array<string> {
  const shape = getStream(node)?.shape ?? 'data'
  const headers = buildResponseHeadersType({ node, types }) !== null
  const result = {
    plain: ['Options', 'StreamResult'],
    full: ['StreamOptions', 'Unwrappable', 'StreamResult'],
    data: ['StreamOptions', 'UnwrappedStreamResult'],
  }[returnType].map((name) => (name.endsWith('Result') ? resultTypeName(name, headers) : name))
  const item = { event: ['SuccessOf', 'TypedEvent'], data: headers ? ['SuccessOf', 'ServerSentEvent'] : [], line: ['SuccessOf'] }[shape]
  return [...result, ...item]
}
