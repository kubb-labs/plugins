import type { ast } from '@kubb/kit'
import { buildResponseHeadersType, type OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'

/**
 * Builds the `RequestResult` type arguments of one operation: responses, `ThrowOnError` and the response headers, when a response declares any.
 *
 * @example
 * `buildRequestResultGenerics({ node, types }) // "LoginUserResponses, ThrowOnError, { '200': LoginUserStatus200Headers }"`
 */
export function buildRequestResultGenerics({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string {
  return [types.response.responses(node), 'ThrowOnError', buildResponseHeadersType({ node, types })].filter(Boolean).join(', ')
}

/**
 * Builds the full return type an operation's function signature uses: `Unwrappable<RequestResult>`
 * for the default `returnType: 'full'`, already a promise so no further wrapping is needed, a plain
 * `Promise<RequestResult>` for the internal `'plain'` shape, or a
 * `Promise` of the runtime's `UnwrappedResult` when `returnType: 'data'` narrows a resolved call
 * down to the bare success body.
 *
 * @example
 * `buildResultType({ node, types, returnType: 'data' }) // 'Promise<UnwrappedResult<AddPetResponses, ThrowOnError>>'`
 */
export function buildResultType({ node, types, returnType }: { node: ast.OperationNode; types: OperationTypeNames; returnType: ReturnTypeOption }): string {
  const responses = types.response.responses(node)
  const headers = buildResponseHeadersType({ node, types })
  const name = returnType === 'data' ? 'UnwrappedResult' : 'RequestResult'
  const result = headers ? `${name}WithHeaders<${responses}, ${headers}, ThrowOnError>` : `${name}<${responses}, ThrowOnError>`
  return returnType === 'full' ? `Unwrappable<${result}>` : `Promise<${result}>`
}
