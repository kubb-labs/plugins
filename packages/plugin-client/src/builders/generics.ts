import type { ast } from '@kubb/kit'
import type { OperationTypeNames } from '@internals/client'
import type { ReturnTypeOption } from '../types.ts'

/**
 * Builds the `RequestResult` type arguments of one operation: responses, `ThrowOnError` and, unless `returnType` is `'data'`, the response headers.
 *
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
 * The status and type name of each response that declares headers.
 */
function getResponseHeaderTypes({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<[ast.StatusCode, string]> {
  const resolve = types.response.headers
  if (!resolve) return []
  return node.responses
    .filter((response) => response.headers?.length)
    .map((response) => [response.statusCode, resolve.call(types.response, node, response.statusCode)])
}

/**
 * The `{ status: headers }` record for the last `RequestResult` type argument, or `null` when no response declares headers.
 */
function buildResponseHeadersType({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string | null {
  const entries = getResponseHeaderTypes({ node, types }).map(([statusCode, name]) => `'${statusCode}': ${name}`)
  return entries.length ? `{ ${entries.join('; ')} }` : null
}

export function getResponseHeadersTypeNames({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<string> {
  return getResponseHeaderTypes({ node, types }).map(([, name]) => name)
}
