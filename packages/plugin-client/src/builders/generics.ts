import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'

/**
 * Builds the `RequestResult` generic arguments for one operation: the per-status responses record,
 * the per-call `ThrowOnError` flag, and, unless `returnType` is `'data'`, the declared response
 * headers by status. `SuccessOf` / `ErrorOf` split the record inside the runtime.
 *
 * @example
 * `buildRequestResultGenerics({ node, types, returnType }) // 'AddPetResponses, ThrowOnError'`
 * @example
 * `buildRequestResultGenerics({ node, types, returnType }) // "LoginUserResponses, ThrowOnError, { '200': LoginUserStatus200Headers }"`
 */
export function buildRequestResultGenerics({
  node,
  types,
  returnType,
}: {
  node: ast.OperationNode
  types: OperationTypeNames
  returnType: ReturnTypeOption
}): string {
  const headers = returnType === 'data' ? null : buildResponseHeadersType({ node, types })
  return [types.response.responses(node), 'ThrowOnError', headers].filter(Boolean).join(', ')
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
  if (returnType === 'data') return `Promise<UnwrappedResult<${responses}, ThrowOnError>>`
  const headers = buildResponseHeadersType({ node, types })
  const result = headers ? `RequestResultWithHeaders<${responses}, ${headers}, ThrowOnError>` : `RequestResult<${responses}, ThrowOnError>`
  if (returnType === 'plain') return `Promise<${result}>`
  return `Unwrappable<${result}>`
}

/**
 * The `{ status: headers }` record of the responses that declare `headers`, the last `RequestResult` type argument, or
 * `null` when none does.
 *
 * @example
 * `buildResponseHeadersType({ node, types }) // "{ '200': ListPetsStatus200Headers }"`
 */
export function buildResponseHeadersType({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string | null {
  const resolve = types.response.headers
  const entries = resolve ? getHeaderStatuses(node).map((statusCode) => `'${statusCode}': ${resolve.call(types.response, node, statusCode)}`) : []
  return entries.length ? `{ ${entries.join('; ')} }` : null
}

function getHeaderStatuses(node: ast.OperationNode): Array<ast.StatusCode> {
  return node.responses.filter((response) => response.headers?.length).map((response) => response.statusCode)
}

/**
 * The type names of the headers an operation's responses declare, which its file imports for `RequestResultWithHeaders`.
 */
export function getResponseHeadersTypeNames({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<string> {
  const resolve = types.response.headers
  return resolve ? getHeaderStatuses(node).map((statusCode) => resolve.call(types.response, node, statusCode)) : []
}
